"use client";
import { useState, useCallback } from "react";
import { SpeakerIcon, SpeakerStopIcon, CopyIcon, CheckIcon } from "./icons";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Inline + block markdown for non-code text. Code fences are handled
 * separately by the segment parser so they can render as copyable boxes.
 */
function renderText(text: string): string {
  let html = escHtml(text);

  // Inline code (single backticks) — keep before other inline rules
  html = html.replace(/`([^`\n]+)`/g, (_m, c) =>
    `<code class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-[0.85em] font-mono">${c}</code>`
  );
  // Bold / italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-semibold text-stone-900 mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-bold text-stone-900 mt-3 mb-1 text-base">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-bold text-stone-900 mt-3 mb-1 text-lg">$1</h1>');
  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-3 border-orange-300 pl-3 my-2 text-stone-600 italic">$1</blockquote>');
  // Ordered list items
  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li class="ml-5 list-decimal">$1</li>');
  // Unordered list items
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li class="ml-5 list-disc">$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>)(?:\s*(?=<li))?/g, (m) => m);
  html = html.replace(/(?:<li[^>]*>.*?<\/li>\s*)+/gs, (m) => `<ul class="my-1.5 space-y-0.5">${m}</ul>`);
  // Links
  html = html.replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-orange-600 underline">$1</a>');
  // Bare line breaks (but not right after block elements)
  html = html.replace(/\n/g, "<br>");
  html = html.replace(/<br>\s*(<(?:h[1-3]|ul|blockquote|li))/g, "$1");
  html = html.replace(/(<\/(?:h[1-3]|ul|blockquote)>)\s*<br>/g, "$1");

  return html;
}

type Segment = { type: "text"; content: string } | { type: "code"; lang: string; content: string };

/**
 * Split content into text and fenced-code segments. Handles an unclosed
 * trailing ``` fence (mid-stream) by treating the remainder as code.
 */
function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const fence = /```([^\n`]*)\n?([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fence.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "text", content: text.slice(last, m.index) });
    segments.push({ type: "code", lang: (m[1] || "").trim(), content: m[2].replace(/\n$/, "") });
    last = fence.lastIndex;
  }
  let rest = text.slice(last);
  // Unterminated code fence still streaming in
  const openIdx = rest.indexOf("```");
  if (openIdx !== -1) {
    if (openIdx > 0) segments.push({ type: "text", content: rest.slice(0, openIdx) });
    const after = rest.slice(openIdx + 3);
    const nl = after.indexOf("\n");
    const lang = nl === -1 ? after.trim() : after.slice(0, nl).trim();
    const body = nl === -1 ? "" : after.slice(nl + 1);
    segments.push({ type: "code", lang, content: body });
    rest = "";
  }
  if (rest) segments.push({ type: "text", content: rest });
  return segments;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [code]);

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-stone-700 bg-stone-900">
      <div className="flex items-center justify-between px-3 py-1.5 bg-stone-800 border-b border-stone-700">
        <span className="text-[11px] font-mono text-stone-400">{lang || "code"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <CheckIcon className="size-3 text-green-400" /> : <CopyIcon className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed">
        <code className="font-mono text-stone-100 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
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
          <div className="bg-orange-500 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  const segments = parseSegments(message.content);

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
            <div className={`text-sm text-stone-800 leading-relaxed${message.isStreaming ? " streaming-cursor" : ""}`}>
              {segments.map((seg, i) =>
                seg.type === "code" ? (
                  <CodeBlock key={i} code={seg.content} lang={seg.lang} />
                ) : (
                  <span key={i} dangerouslySetInnerHTML={{ __html: renderText(seg.content) }} />
                )
              )}
            </div>
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
                  title="Copy entire message"
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
