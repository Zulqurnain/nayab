/**
 * Layer 2 & 9: Chat API with Zod validation, standardised errors, DB-backed rate limiting.
 * Layer 12: Usage logging.
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimitDb } from "@/lib/rate-limit-db";
import { getSessionUser } from "@/lib/auth-middleware";
import { logRequest } from "@/lib/logger";
import { getDb, usageLogs } from "@/lib/db";
import type { ModelId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const OFFLLAMA_URL = process.env.OFFLLAMA_URL ?? "http://127.0.0.1:8080";
const OFFLLAMA_KEY = process.env.OFFLLAMA_API_KEY ?? "";
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

// ─── Zod schema ─────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(32_000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  model: z.enum(["offllama", "gpt-4o-mini", "claude-haiku", "gpt-4o", "claude-sonnet"]),
  searchEnabled: z.boolean().optional(),
  searchQuery: z.string().max(500).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function sseChunk(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`);
}
function sseDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}
function sseError(msg: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ error: msg })}\n\n`);
}
function errResponse(code: string, message: string, status: number, retryAfter?: number) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return new Response(JSON.stringify({ error: { code, message } }), { status, headers });
}

async function pseudoStream(text: string, ctrl: ReadableStreamDefaultController) {
  for (const chunk of text.split(/(\s+)/)) {
    if (!chunk) continue;
    ctrl.enqueue(sseChunk(chunk));
    await new Promise((r) => setTimeout(r, 20));
  }
}

async function callOffllama(
  messages: z.infer<typeof MessageSchema>[],
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(`${OFFLLAMA_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OFFLLAMA_KEY ? { Authorization: `Bearer ${OFFLLAMA_KEY}` } : {}),
    },
    body: JSON.stringify({ model: "local", messages, max_tokens: 300, temperature: 0.7 }),
    signal,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`offLLama error ${res.status}: ${err}`);
  }
  const json = await res.json();
  return (json.choices?.[0]?.message?.content as string) ?? "";
}

async function streamOpenAI(
  messages: z.infer<typeof MessageSchema>[],
  model: string,
  ctrl: ReadableStreamDefaultController,
  signal: AbortSignal
) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 2048 }),
    signal,
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.replace(/^data: /, "").trim();
      if (!t || t === "[DONE]") continue;
      try {
        const c = JSON.parse(t);
        const text = c.choices?.[0]?.delta?.content;
        if (text) ctrl.enqueue(sseChunk(text));
      } catch { /* ignore */ }
    }
  }
}

async function streamAnthropic(
  messages: z.infer<typeof MessageSchema>[],
  model: string,
  ctrl: ReadableStreamDefaultController,
  signal: AbortSignal
) {
  const system = messages.find((m) => m.role === "system")?.content;
  const userMessages = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      messages: userMessages,
      max_tokens: 2048,
      stream: true,
      ...(system ? { system } : {}),
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.replace(/^data: /, "").trim();
      if (!t) continue;
      try {
        const evt = JSON.parse(t);
        if (evt.type === "content_block_delta" && evt.delta?.text) {
          ctrl.enqueue(sseChunk(evt.delta.text));
        }
      } catch { /* ignore */ }
    }
  }
}

const OPENAI_MODEL_MAP: Record<string, string> = {
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
};
const ANTHROPIC_MODEL_MAP: Record<string, string> = {
  "claude-haiku": "claude-3-haiku-20240307",
  "claude-sonnet": "claude-sonnet-4-6",
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = getClientIp(req);

  // Layer 8: CORS
  const origin = req.headers.get("origin");

  // Request size guard
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 2_097_152) {
    return errResponse("REQUEST_TOO_LARGE", "Request too large", 413);
  }

  // Layer 4: Get session user (optional)
  let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = null;
  try {
    sessionUser = await getSessionUser(req);
  } catch { /* unauthenticated — ok */ }

  const plan = sessionUser?.plan ?? "free";

  // Layer 9: DB-backed rate limiting
  const rlKey = sessionUser ? `user:${sessionUser.id}` : `ip:${ip}`;
  const rl = checkRateLimitDb(rlKey, plan);
  if (!rl.allowed) {
    logRequest({ method: "POST", path: "/api/chat", statusCode: 429, latencyMs: Date.now() - start, ip, userId: sessionUser?.id });
    return errResponse("RATE_LIMITED", "Rate limited. Please wait before sending another message.", 429, Math.ceil(rl.retryAfterMs / 1000));
  }

  // Layer 2: Zod validation
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errResponse("BAD_REQUEST", "Invalid JSON", 400);
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errResponse("VALIDATION_ERROR", "Validation failed", 400);
  }

  const { messages, model, searchEnabled, searchQuery } = parsed.data;

  // Verify paid license for paid models
  const isPaidModel = model !== "offllama";
  if (isPaidModel) {
    const license = req.headers.get("x-license-key");
    const hasPaidSession = sessionUser?.plan === "paid";
    if (!license && !hasPaidSession) {
      return errResponse("PAYMENT_REQUIRED", "Paid plan required. Please enter your license key.", 402);
    }
  }

  // Build live context block injected into system prompt
  const now = new Date();
  const dateStr = now.toUTCString(); // e.g. "Sun, 01 Jun 2026 16:00:00 GMT"
  const liveContext = [
    `Current date and time: ${dateStr}`,
    `User's IP address: ${ip}`,
  ].join("\n");

  const finalMessages = [...messages].map(m => ({ ...m }));

  // Inject live context at the top of the system message (or prepend one)
  const sysIdx = finalMessages.findIndex(m => m.role === "system");
  if (sysIdx >= 0) {
    finalMessages[sysIdx] = {
      ...finalMessages[sysIdx],
      content: `${liveContext}\n\n${finalMessages[sysIdx].content}`,
    };
  } else {
    finalMessages.unshift({ role: "system", content: liveContext });
  }

  // Prepend search context if provided
  if (searchEnabled && searchQuery) {
    const lastUser = finalMessages.filter((m) => m.role === "user").pop();
    if (lastUser) {
      lastUser.content = `[Web search context for query "${searchQuery}"]\n\n${lastUser.content}`;
    }
  }

  const signal = AbortSignal.timeout(90_000);
  let tokenEstimate = 0;
  let statusCode = 200;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (model === "offllama") {
          const text = await callOffllama(finalMessages, signal);
          tokenEstimate = Math.ceil(text.length / 4);
          await pseudoStream(text, controller);
        } else if (model in OPENAI_MODEL_MAP) {
          if (!OPENAI_KEY) throw new Error("OpenAI not configured on this server.");
          await streamOpenAI(finalMessages, OPENAI_MODEL_MAP[model as ModelId], controller, signal);
        } else if (model in ANTHROPIC_MODEL_MAP) {
          if (!ANTHROPIC_KEY) throw new Error("Anthropic not configured on this server.");
          await streamAnthropic(finalMessages, ANTHROPIC_MODEL_MAP[model as ModelId], controller, signal);
        } else {
          throw new Error(`Unknown model: ${model}`);
        }
        controller.enqueue(sseDone());
      } catch (err) {
        statusCode = 500;
        const msg = err instanceof Error ? err.message : "Internal error";
        controller.enqueue(sseError(msg));
        controller.enqueue(sseDone());
      } finally {
        controller.close();
        // Layer 12: Log usage
        try {
          getDb().insert(usageLogs).values({
            userId: sessionUser?.id ?? null,
            ip,
            model,
            tokens: tokenEstimate,
            latencyMs: Date.now() - start,
            createdAt: new Date(),
          }).run();
        } catch { /* non-critical */ }
        logRequest({
          method: "POST",
          path: "/api/chat",
          statusCode,
          latencyMs: Date.now() - start,
          userId: sessionUser?.id,
          ip,
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    },
  });
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-license-key",
    },
  });
}
