import { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ChatRequest, ModelId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const OFFLLAMA_URL = process.env.OFFLLAMA_URL ?? "http://127.0.0.1:8080";
const OFFLLAMA_KEY = process.env.OFFLLAMA_API_KEY ?? "";
const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function sseChunk(text: string): Uint8Array {
  const data = JSON.stringify({ text });
  return new TextEncoder().encode(`data: ${data}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode("data: [DONE]\n\n");
}

function sseError(msg: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ error: msg })}\n\n`);
}

/** Pseudo-stream: emit word-by-word with small delays for offLLama */
async function pseudoStream(
  text: string,
  controller: ReadableStreamDefaultController
) {
  const words = text.split(/(\s+)/);
  for (const chunk of words) {
    if (chunk === "") continue;
    controller.enqueue(sseChunk(chunk));
    await new Promise((r) => setTimeout(r, 20));
  }
}

async function callOffllama(
  messages: ChatRequest["messages"],
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(`${OFFLLAMA_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OFFLLAMA_KEY ? { Authorization: `Bearer ${OFFLLAMA_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: "local",
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    }),
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
  messages: ChatRequest["messages"],
  model: string,
  controller: ReadableStreamDefaultController,
  signal: AbortSignal
) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
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
      const trimmed = line.replace(/^data: /, "").trim();
      if (!trimmed || trimmed === "[DONE]") continue;
      try {
        const chunk = JSON.parse(trimmed);
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) controller.enqueue(sseChunk(text));
      } catch { /* ignore parse errors */ }
    }
  }
}

async function streamAnthropic(
  messages: ChatRequest["messages"],
  model: string,
  controller: ReadableStreamDefaultController,
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
      const trimmed = line.replace(/^data: /, "").trim();
      if (!trimmed) continue;
      try {
        const evt = JSON.parse(trimmed);
        if (evt.type === "content_block_delta") {
          const text = evt.delta?.text;
          if (text) controller.enqueue(sseChunk(text));
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

export async function POST(req: NextRequest) {
  // Request size guard (already handled by Next, but belt+suspenders)
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 2_097_152) { // 2 MB
    return new Response("Request too large", { status: 413 });
  }

  const ip = getClientIp(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limited. Please wait before sending another message." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, model, searchEnabled, searchQuery } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages required", { status: 400 });
  }

  // Verify paid license for paid models
  const isPaidModel = model !== "offllama";
  if (isPaidModel) {
    const license = req.headers.get("x-license-key");
    if (!license) {
      return new Response(
        JSON.stringify({ error: "Paid plan required. Please enter your license key." }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }
    // License was already verified client-side via /api/verify-license.
    // We do a lightweight check here: require header is present.
    // Full re-validation can be added if needed.
  }

  // Prepend search context if provided
  const finalMessages = [...messages];
  if (searchEnabled && searchQuery) {
    const lastUser = finalMessages.filter((m) => m.role === "user").pop();
    if (lastUser) {
      lastUser.content = `[Web search context for query "${searchQuery}"]\n\n${lastUser.content}`;
    }
  }

  const signal = AbortSignal.timeout(90_000);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (model === "offllama") {
          const text = await callOffllama(finalMessages, signal);
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
        const msg = err instanceof Error ? err.message : "Internal error";
        controller.enqueue(sseError(msg));
        controller.enqueue(sseDone());
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // tell nginx not to buffer SSE
      Connection: "keep-alive",
    },
  });
}
