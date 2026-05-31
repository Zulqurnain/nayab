"use client";
import { useState } from "react";
import { KeyIcon, XIcon } from "./icons";

interface Props {
  onClose: () => void;
  onVerified: (key: string) => void;
}

export function PaidModal({ onClose, onVerified }: Props) {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [error, setError] = useState("");

  async function verify() {
    if (!key.trim()) return;
    setStatus("checking");
    setError("");
    try {
      const res = await fetch("/api/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        onVerified(key.trim());
      } else {
        setError(data.error ?? "Invalid license key.");
        setStatus("error");
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">Activate Paid Plan</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors">
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Pricing */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-orange-700 text-xl">$10</span>
            <span className="text-orange-500 text-sm font-medium">/ month</span>
          </div>
          <p className="text-sm text-orange-800 font-medium mb-2">Nayab Pro — Paid Plan</p>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>— Switch between 5 AI models (GPT-4o, Claude, Qwen…)</li>
            <li>— Subject to fair use: ~300 messages/day guideline</li>
            <li>— Priority inference — faster responses</li>
            <li>— Support the project</li>
          </ul>
          <p className="text-xs text-orange-500 mt-2 italic">
            &ldquo;Unlimited&rdquo; means fair use — not guaranteed unlimited throughput.
            We may apply soft limits to protect service quality.
          </p>
        </div>

        <a
          href="https://zulqurnainjj.gumroad.com/l/nayab"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl py-2.5 mb-4 transition-colors"
        >
          Buy on Gumroad →
        </a>

        <div className="border-t border-stone-100 pt-4">
          <p className="text-sm text-stone-500 mb-3">Already have a license key?</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={verify}
              disabled={status === "checking" || !key.trim()}
              className="bg-stone-800 text-white px-4 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              {status === "checking" ? "…" : "Verify"}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        {/* Support */}
        <div className="mt-5 pt-4 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400">
            Want to support without a subscription?{" "}
            <a
              href="https://ko-fi.com/zulqurnainjj"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 hover:underline font-medium"
            >
              Buy me a coffee on Ko-fi
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
