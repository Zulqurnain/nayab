"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { KeyIcon, XIcon, SparklesIcon } from "./icons";

interface Props {
  onClose: () => void;
  onVerified: (key: string) => void;
}

export function PaidModal({ onClose, onVerified }: Props) {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function verify() {
    const trimmed = key.trim();
    if (!trimmed) return;
    setStatus("checking");
    setErrorMsg("");
    try {
      const res = await fetch("/api/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: trimmed }),
      });
      const data = await res.json() as {
        valid?: boolean;
        message?: string;
        email?: string;
        requiresSessionRefresh?: boolean;
        error?: { message?: string };
      };

      if (data.valid) {
        setStatus("success");
        // If logged in, refresh session so dashboard shows Pro plan
        if (data.requiresSessionRefresh) {
          // Silently refresh — triggers JWT callback which re-reads DB
          await signIn("credentials", { redirect: false, refreshSession: true }).catch(() => {});
        }
        onVerified(trimmed);
      } else {
        const msg = data.message ?? data.error?.message ?? "Invalid or expired license key.";
        setErrorMsg(msg);
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Check your connection and try again.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <SparklesIcon className="size-4 text-white" />
            </div>
            <h2 className="font-semibold text-stone-900">Nayab Pro</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded-lg hover:bg-stone-100"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Plan card */}
          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 mb-5 text-white overflow-hidden">
            <div className="absolute -right-4 -top-4 size-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-6 size-32 rounded-full bg-white/5" />
            <div className="relative">
              <p className="text-orange-100 text-xs font-medium uppercase tracking-wider mb-1">Nayab Pro Plan</p>
              <div className="flex items-end gap-1 mb-3">
                <span className="text-4xl font-extrabold">$10</span>
                <span className="text-orange-200 mb-1 text-sm">/month</span>
              </div>
              <ul className="space-y-1.5 text-sm">
                {[
                  "GPT-4o, Claude Sonnet, GPT-4o Mini, Claude Haiku",
                  "~300 messages/day fair use",
                  "Priority inference — faster responses",
                  "File uploads & web search",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-orange-50">
                    <span className="text-orange-200">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Buy button */}
          <a
            href="https://zulqurnainjj.gumroad.com/l/nayab"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl py-3 mb-5 transition-colors"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.25 13.5h-3v3h-4.5v-3h-3v-4.5h3v-3h4.5v3h3v4.5z" />
            </svg>
            Buy on Gumroad — $10/mo
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-xs text-stone-400 font-medium">Already have a license key?</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          {/* License key input */}
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Enter license key from Gumroad email"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-shadow"
              />
            </div>
            <button
              onClick={verify}
              disabled={status === "checking" || !key.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 rounded-xl text-sm font-medium transition-colors"
            >
              {status === "checking" ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin size-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Checking
                </span>
              ) : "Activate"}
            </button>
          </div>

          {errorMsg && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <span>⚠</span> {errorMsg}
            </p>
          )}
          {status === "success" && (
            <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
              <span>✓</span> License activated! You now have full access.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400">
            Support the project without a subscription —{" "}
            <a
              href="https://ko-fi.com/zulqurnainjj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline font-medium"
            >
              buy me a coffee on Ko-fi ☕
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
