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
import { checkTokenQuota } from "@/lib/token-quota";
import type { ModelId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// llmizeOFF runtime URL (self-hosted inference server)
const LLMIZEOFF_URL = process.env.OFFLLAMA_URL ?? "http://127.0.0.1:8080";
const LLMIZEOFF_KEY = process.env.OFFLLAMA_API_KEY ?? "";
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const GROQ_KEY = process.env.GROQ_API_KEY ?? "";

// ─── Zod schema ─────────────────────────────────────────────────────────────

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(32_000),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  model: z.enum(["llmizeoff", "groq-llama", "gpt-4o-mini", "claude-haiku", "gpt-4o", "claude-sonnet"]),
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

// Real token streaming from llmizeOFF runtime — first token appears as soon as inference starts
async function streamLlmizeOff(
  messages: z.infer<typeof MessageSchema>[],
  ctrl: ReadableStreamDefaultController,
  signal: AbortSignal
): Promise<number> {
  const res = await fetch(`${LLMIZEOFF_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(LLMIZEOFF_KEY ? { Authorization: `Bearer ${LLMIZEOFF_KEY}` } : {}),
    },
    body: JSON.stringify({ model: "local", messages, max_tokens: 200, temperature: 0.7, stream: true }),
    signal,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`llmizeOFF error ${res.status}: ${err}`);
  }
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let chars = 0;
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
        if (text) { ctrl.enqueue(sseChunk(text)); chars += text.length; }
      } catch { /* ignore malformed SSE */ }
    }
  }
  return chars;
}

async function streamOpenAI(
  messages: z.infer<typeof MessageSchema>[],
  model: string,
  ctrl: ReadableStreamDefaultController,
  signal: AbortSignal
): Promise<number> {
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
  let chars = 0;
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
        if (text) { ctrl.enqueue(sseChunk(text)); chars += text.length; }
      } catch { /* ignore */ }
    }
  }
  return chars;
}

async function streamAnthropic(
  messages: z.infer<typeof MessageSchema>[],
  model: string,
  ctrl: ReadableStreamDefaultController,
  signal: AbortSignal
): Promise<number> {
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
  let chars = 0;
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
          chars += evt.delta.text.length;
        }
      } catch { /* ignore */ }
    }
  }
  return chars;
}

// Groq — free OpenAI-compatible API, sub-1-second first token via LPU chips
async function streamGroq(
  messages: z.infer<typeof MessageSchema>[],
  ctrl: ReadableStreamDefaultController,
  signal: AbortSignal
): Promise<number> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
    signal,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Groq error ${res.status}: ${err}`);
  }
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let chars = 0;
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
        if (text) { ctrl.enqueue(sseChunk(text)); chars += text.length; }
      } catch { /* ignore */ }
    }
  }
  return chars;
}

// Knowledge about Nayab's creator — injected when a user asks about him,
// since the small local model has no inherent knowledge of him. Kept compact
// so it doesn't blow up prompt-eval time on the CPU model.
const CREATOR_BIO = `Zulqurnain Haider — software engineer & maker in Lahore, Pakistan. Builds mobile/web/AI tools (React Native, Flutter, Go, Python, Node.js). Creator of llmizeOFF (self-hosted LLM runtime) and Nayab. Website: zulqurnainj.com. LinkedIn: @zulqurnainj. GitHub: github.com/Zulqurnain.`;

const CREATOR_PATTERN = /zulqurnain|zulqurnainj|who (made|built|created) (you|nayab)|who is your (creator|maker|developer|author)/i;

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

  // Verify paid license for paid models (llmizeoff and groq-llama are free)
  const isPaidModel = model !== "llmizeoff" && model !== "groq-llama";
  if (isPaidModel) {
    const license = req.headers.get("x-license-key");
    const hasPaidSession = sessionUser?.plan === "paid";
    if (!license && !hasPaidSession) {
      return errResponse("PAYMENT_REQUIRED", "Paid plan required. Please enter your license key.", 402);
    }
  }

  // Free token quota (8-hour window): 20k anon / 200k signed-in / unlimited paid
  const hasLicense = !!req.headers.get("x-license-key");
  const effectivePlan = plan === "paid" || hasLicense ? "paid" : "free";
  const quota = checkTokenQuota({ userId: sessionUser?.id ?? null, ip, plan: effectivePlan });
  if (!quota.allowed) {
    logRequest({ method: "POST", path: "/api/chat", statusCode: 402, latencyMs: Date.now() - start, ip, userId: sessionUser?.id });
    const resetIn = Math.max(0, Math.ceil((quota.resetAt - Date.now()) / 60000));
    return new Response(
      JSON.stringify({
        error: {
          code: "TOKEN_LIMIT",
          message: quota.signedIn
            ? `You've used your 200,000 free tokens for this 8-hour window. Resets in ~${resetIn} min, or upgrade to Pro for unlimited.`
            : `You've used your 20,000 free tokens. Sign up free for 200,000 tokens every 8 hours.`,
          signedIn: quota.signedIn,
          used: quota.used,
          limit: quota.limit,
          resetAt: quota.resetAt,
        },
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // Inject compact live context — keep it short to minimise prompt-eval time
  const now = new Date();
  const dateStr = now.toUTCString();
  let liveContext = `Date: ${dateStr} | IP: ${ip}`;

  // If the user is asking about the creator, add his bio to the context.
  const lastUserContent = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (CREATOR_PATTERN.test(lastUserContent)) {
    liveContext += `\n\n${CREATOR_BIO}`;
  }

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
  // Prompt tokens are known upfront; completion chars accumulate during streaming.
  const promptChars = finalMessages.reduce((n, m) => n + m.content.length, 0);
  let completionChars = 0;
  let tokenEstimate = 0;
  let statusCode = 200;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (model === "llmizeoff") {
          completionChars = await streamLlmizeOff(finalMessages, controller, signal);
        } else if (model === "groq-llama") {
          if (!GROQ_KEY) throw new Error("Groq not configured on this server. Add GROQ_API_KEY to .env.local");
          completionChars = await streamGroq(finalMessages, controller, signal);
        } else if (model in OPENAI_MODEL_MAP) {
          if (!OPENAI_KEY) throw new Error("OpenAI not configured on this server.");
          completionChars = await streamOpenAI(finalMessages, OPENAI_MODEL_MAP[model as ModelId], controller, signal);
        } else if (model in ANTHROPIC_MODEL_MAP) {
          if (!ANTHROPIC_KEY) throw new Error("Anthropic not configured on this server.");
          completionChars = await streamAnthropic(finalMessages, ANTHROPIC_MODEL_MAP[model as ModelId], controller, signal);
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
        // Token accounting: prompt + completion (~4 chars/token)
        tokenEstimate = Math.ceil((promptChars + completionChars) / 4);
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
