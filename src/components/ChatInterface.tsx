"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Composer } from "./Composer";
import { ChatMessageComponent } from "./ChatMessage";
import { ModelPicker } from "./ModelPicker";
import { PaidModal } from "./PaidModal";
import { SparklesIcon, TrashIcon, KeyIcon } from "./icons";
import type { ChatMessage, ModelId, Attachment, LicenseState } from "@/lib/types";

const SYSTEM_PROMPT = `You are Nayab, a helpful, fast, and friendly AI assistant. You are powered by offLLama, a self-hosted inference engine. Be concise, clear, and helpful. Format responses with markdown when appropriate.`;

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

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [model, setModel] = useState<ModelId>("offllama");
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load license from localStorage on mount
  useEffect(() => {
    setLicense(loadLicense());
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isPaid = license?.isValid ?? false;

  const handleVerified = useCallback((key: string) => {
    saveLicense(key);
    setLicense({ isValid: true, key, validatedAt: Date.now() });
    setShowPaidModal(false);
  }, []);

  const handleClearLicense = useCallback(() => {
    clearLicense();
    setLicense(null);
    setModel("offllama");
  }, []);

  async function handleSend(text: string, attachments: Attachment[], search: boolean) {
    setError("");

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
        setShowPaidModal(true);
        throw new Error(data.error ?? "Paid plan required.");
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
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      {showPaidModal && (
        <PaidModal onClose={() => setShowPaidModal(false)} onVerified={handleVerified} />
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="shrink-0 border-b border-stone-200 bg-white/90 backdrop-blur-sm z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-orange-500 flex items-center justify-center">
                <SparklesIcon className="size-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-stone-900 text-sm leading-tight">Nayab</h1>
                <a href="/llms.txt" className="text-[10px] text-stone-400 leading-none hover:text-orange-500">Powered by offLLama</a>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
              <p className="text-stone-500 text-center max-w-xs mb-8 text-sm leading-relaxed">
                A fast, private AI assistant powered by{" "}
                <a href="https://github.com/Zulqurnain/offllama" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                  offLLama
                </a>
                . No sign-up, no data retention.
              </p>

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
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
