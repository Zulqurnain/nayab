"use client";
import { useState, useCallback } from "react";
import { SpeakerIcon, SpeakerStopIcon, CopyIcon, CheckIcon } from "./icons";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

function renderMarkdown(text: string): string {
  return text
    .replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${escHtml(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, (_m, code) => `<code>${escHtml(code)}</code>`)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hupol])(.+)$/gm, "$1")
    .replace(/\n/g, "<br>");
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface Props {
  message: ChatMessageType;
}

export function ChatMessageComponent({ message }: Props) {
  const isUser = message.role === "user";
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [speaking, message.content]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [message.content]);

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="max-w-[80%]">
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1.5 justify-end">
              {message.attachments.map((a, i) => (
                <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                  {a.name}
                </span>
              ))}
            </div>
          )}
          <div className="bg-orange-500 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4 animate-fade-in">
      {/* Avatar */}
      <div className="shrink-0 size-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center mt-1">
        <span className="text-orange-600 font-bold text-xs">N</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Typing indicator */}
        {message.isStreaming && message.content === "" ? (
          <div className="flex gap-1 items-center h-7">
            <span className="typing-dot size-2 rounded-full bg-orange-400 inline-block" />
            <span className="typing-dot size-2 rounded-full bg-orange-400 inline-block" />
            <span className="typing-dot size-2 rounded-full bg-orange-400 inline-block" />
          </div>
        ) : (
          <>
            <div
              className={`prose-chat text-sm text-stone-800 leading-relaxed${message.isStreaming ? " streaming-cursor" : ""}`}
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(message.content),
              }}
            />
            {!message.isStreaming && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={speak}
                  className="text-stone-400 hover:text-orange-500 transition-colors p-1"
                  title={speaking ? "Stop speaking" : "Read aloud"}
                >
                  {speaking ? <SpeakerStopIcon className="size-3.5" /> : <SpeakerIcon className="size-3.5" />}
                </button>
                <button
                  onClick={copy}
                  className="text-stone-400 hover:text-orange-500 transition-colors p-1"
                  title="Copy"
                >
                  {copied ? <CheckIcon className="size-3.5 text-green-500" /> : <CopyIcon className="size-3.5" />}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
