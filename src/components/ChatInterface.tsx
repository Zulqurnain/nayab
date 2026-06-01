"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Composer } from "./Composer";
import { ChatMessageComponent } from "./ChatMessage";
import { ModelPicker } from "./ModelPicker";
import { PaidModal } from "./PaidModal";
import { SparklesIcon, TrashIcon, KeyIcon } from "./icons";
import type { ChatMessage, ModelId, Attachment, LicenseState } from "@/lib/types";

const SYSTEM_PROMPT = `You are Nayab, a demo of llmizeOFF — a self-hosted LLM runtime.
Be helpful, accurate, and concise. Use date/IP from context when asked. No filler phrases. Markdown only for code/lists.`;

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadLicense(): LicenseState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("nayab_license");
    if (!raw) return null;
    const state = JSON.parse(raw) as LicenseState;
    // Expire after 24 hours — re-validate
    if (Date.now() - state.validatedAt > 86_400_000) return null;
    return state;
  } catch { return null; }
}

function saveLicense(key: string) {
  localStorage.setItem("nayab_license", JSON.stringify({ isValid: true, key, validatedAt: Date.now() }));
}

function clearLicense() {
  localStorage.removeItem("nayab_license");
}

interface UsageState {
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: number;
  signedIn: boolean;
  unlimited: boolean;
}

export function ChatInterface() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [model, setModel] = useState<ModelId>("llmizeoff");
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<UsageState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch token quota status (and refresh after each message)
  const refreshUsage = useCallback(async () => {
    try {
      const lic = loadLicense();
      const res = await fetch("/api/usage", {
        headers: lic?.key ? { "x-license-key": lic.key } : {},
      });
      if (res.ok) setUsage(await res.json());
    } catch { /* non-critical */ }
  }, []);

  // Load license from localStorage on mount
  useEffect(() => {
    setLicense(loadLicense());
    refreshUsage();
  }, [refreshUsage]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // isPaid: true if session plan is "paid" OR if a valid localStorage license exists
  const sessionPlan = (session?.user as { plan?: string } | undefined)?.plan;
  const isPaid = sessionPlan === "paid" || (license?.isValid ?? false);

  const handleVerified = useCallback((key: string) => {
    saveLicense(key);
    setLicense({ isValid: true, key, validatedAt: Date.now() });
    setShowPaidModal(false);
  }, []);

  const handleClearLicense = useCallback(() => {
    clearLicense();
    setLicense(null);
    setModel("llmizeoff");
  }, []);

  async function handleSend(text: string, attachments: Attachment[], search: boolean) {
    setError("");

    // Token quota is enforced server-side (20k anon / 200k signed-in per 8h).
    // If the client already knows the quota is exhausted, gate early for snappy UX.
    if (usage && !usage.unlimited && usage.remaining !== null && usage.remaining <= 0) {
      setShowAuthWall(true);
      return;
    }

    // Build content with attachment context
    let content = text;
    if (attachments.length > 0) {
      const ctx = attachments.map((a) => `[File: ${a.name}]\n${a.content}`).join("\n\n---\n\n");
      content = `${ctx}\n\n---\n\nUser question: ${text}`;
    }

    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: text, // display original text
      attachments,
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    let searchContext = "";
    if (search && text.trim()) {
      try {
        const sRes = await fetch(`/api/search?q=${encodeURIComponent(text)}`);
        const sData = await sRes.json();
        searchContext = sData.context ?? "";
      } catch { /* ignore search errors */ }
    }

    // Build message history for API
    const history = messages.slice(-20).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const apiMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...history,
      {
        role: "user" as const,
        content: searchContext
          ? `[Web Search Results]\n${searchContext}\n\n---\n\nUser: ${content}`
          : content,
      },
    ];

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(isPaid && license?.key ? { "x-license-key": license.key } : {}),
        },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          searchEnabled: search,
          searchQuery: text,
        }),
        signal: ctrl.signal,
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Rate limited — please wait a moment before sending again.");
      }
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        const code = data.error?.code;
        const msg = data.error?.message ?? data.error ?? "Limit reached.";
        if (code === "TOKEN_LIMIT") {
          // Out of free tokens: anon → sign-up wall, signed-in → upgrade modal
          if (data.error?.signedIn) setShowPaidModal(true);
          else setShowAuthWall(true);
          refreshUsage();
        } else {
          // Paid model requires a license
          setShowPaidModal(true);
        }
        throw new Error(typeof msg === "string" ? msg : "Limit reached.");
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let accumulated = "";

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
            if (chunk.error) throw new Error(chunk.error);
            if (chunk.text) {
              accumulated += chunk.text;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: accumulated } : m
                )
              );
            }
          } catch (parseErr) {
            if ((parseErr as Error).message !== "Unexpected token") {
              throw parseErr;
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, isStreaming: false, content: m.content || "(stopped)" } : m
          )
        );
      } else {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      refreshUsage(); // update remaining-token display after each message
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      {showPaidModal && (
        <PaidModal onClose={() => setShowPaidModal(false)} onVerified={handleVerified} />
      )}

      {/* Auth wall — shown when anonymous free tokens are exhausted */}
      {showAuthWall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="size-14 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
              <SparklesIcon className="size-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">You&apos;re out of free tokens</h2>
            <p className="text-stone-500 text-sm mb-1">
              You&apos;ve used your <span className="font-semibold text-stone-700">20,000 free tokens</span>.
            </p>
            <p className="text-stone-400 text-xs mb-6">
              Create a free account to get <span className="font-semibold text-orange-600">200,000 tokens</span> every 8 hours. No credit card needed.
            </p>
            <div className="space-y-3">
              <Link
                href="/auth/signup"
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Create free account — 200k tokens
              </Link>
              <Link
                href="/auth/login"
                className="block w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Sign in
              </Link>
            </div>
            <p className="text-[11px] text-stone-400 mt-5 leading-relaxed">
              Nayab is the online demo for{" "}
              <a href="https://github.com/Zulqurnain/llmizeoff" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-500">llmizeOFF</a>
              {" "}— a self-hosted LLM runtime. Free forever on your own server.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="shrink-0 border-b border-stone-200 bg-white/90 backdrop-blur-sm z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="size-8 rounded-xl bg-orange-500 flex items-center justify-center">
                <SparklesIcon className="size-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-stone-900 text-sm">Nayab</span>
                <span className="hidden sm:inline text-[10px] text-stone-400 ml-1.5">demo of llmizeOFF</span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/about" className="text-sm px-3 py-1.5 rounded-lg font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">About</Link>
              <Link href="/pricing" className="text-sm px-3 py-1.5 rounded-lg font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">Pricing</Link>
              {session?.user ? (
                <>
                  <Link href="/dashboard" className="text-sm px-3 py-1.5 rounded-lg font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">Dashboard</Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm px-3 py-1.5 rounded-lg font-medium text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="text-sm px-3 py-1.5 rounded-lg font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors">Sign in</Link>
              )}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2 shrink-0">
              <ModelPicker
                value={model}
                onChange={setModel}
                isPaid={isPaid}
                onNeedsPaid={() => setShowPaidModal(true)}
              />

              {isPaid ? (
                <button
                  onClick={handleClearLicense}
                  className="text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-2 py-1 rounded-lg transition-colors font-medium"
                  title="Logged in as paid user — click to sign out"
                >
                  Pro
                </button>
              ) : (
                <button
                  onClick={() => setShowPaidModal(true)}
                  className="flex items-center gap-1 text-xs text-stone-500 hover:text-orange-600 bg-stone-100 hover:bg-orange-50 border border-stone-200 hover:border-orange-200 px-2 py-1 rounded-lg transition-all font-medium"
                  title="Upgrade to paid plan"
                >
                  <KeyIcon className="size-3" />
                  Upgrade
                </button>
              )}

              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-stone-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                  title="Clear chat"
                >
                  <TrashIcon className="size-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto">
          {!hasMessages ? (
            /* Landing state — centered */
            <div className="h-full flex flex-col items-center justify-center px-4 py-12">
              <div className="size-16 rounded-3xl bg-orange-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-200">
                <SparklesIcon className="size-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-stone-900 mb-2 text-center">Nayab</h2>
              <p className="text-stone-500 text-center max-w-xs mb-2 text-sm leading-relaxed">
                Online demo for{" "}
                <a href="https://github.com/Zulqurnain/llmizeoff" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-medium">
                  llmizeOFF
                </a>
                {" "}— a self-hosted LLM runtime. Private, no data retention.
              </p>
              {usage && !usage.unlimited && !usage.signedIn && (
                <p className="text-[11px] text-stone-400 text-center mb-8">
                  <Link href="/auth/signup" className="text-orange-500 hover:underline">Sign up free</Link> for 200,000 tokens every 8 hours
                </p>
              )}
              {(!usage || usage.unlimited || usage.signedIn) && <div className="mb-8" />}

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {[
                  "Streaming responses",
                  "File uploads",
                  "Text to speech",
                  "Web search",
                  "100% private",
                ].map((f) => (
                  <span key={f} className="text-xs bg-white border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full shadow-sm">
                    {f}
                  </span>
                ))}
              </div>

              {/* Composer centered */}
              <div className="w-full max-w-2xl">
                <Composer
                  onSend={handleSend}
                  disabled={isStreaming}
                  placeholder="Ask Nayab anything…"
                  searchEnabled={searchEnabled}
                  onToggleSearch={() => setSearchEnabled((v) => !v)}
                  tokensUsed={usage?.used}
                  tokensLimit={usage?.limit ?? null}
                  unlimited={usage?.unlimited}
                />
              </div>

              {/* Support section */}
              <div className="mt-8 text-center max-w-sm">
                <p className="text-xs text-stone-400">
                  Business or enterprise?{" "}
                  <button onClick={() => setShowPaidModal(true)} className="text-orange-500 hover:underline">
                    Get the paid plan
                  </button>{" "}
                  or{" "}
                  <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                    support on Ko-fi
                  </a>
                </p>
              </div>
            </div>
          ) : (
            /* Chat state */
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg) => (
                <ChatMessageComponent key={msg.id} message={msg} />
              ))}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in">
                  {error}
                </div>
              )}
              {isStreaming && (
                <button
                  onClick={() => abortRef.current?.abort()}
                  className="mb-4 text-xs text-stone-500 hover:text-red-500 border border-stone-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-all"
                >
                  Stop generating
                </button>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Fixed bottom composer (only in chat state) */}
        {hasMessages && (
          <div className="shrink-0 border-t border-stone-200 bg-white/95 backdrop-blur-sm">
            <div className="max-w-3xl mx-auto px-4 py-3">
              <Composer
                onSend={handleSend}
                disabled={isStreaming}
                placeholder="Message Nayab…"
                searchEnabled={searchEnabled}
                onToggleSearch={() => setSearchEnabled((v) => !v)}
                tokensUsed={usage?.used}
                tokensLimit={usage?.limit ?? null}
                unlimited={usage?.unlimited}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
