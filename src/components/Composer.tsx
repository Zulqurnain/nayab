"use client";
import { useRef, useState, useCallback } from "react";
import { SendIcon, PaperclipIcon, GlobeIcon, XIcon } from "./icons";
import type { Attachment } from "@/lib/types";

const ALLOWED_TYPES: Record<string, boolean> = {
  "application/pdf": true,
  "text/plain": true,
  "text/rtf": true,
  "application/rtf": true,
  "image/png": true,
  "image/jpeg": true,
};
const ALLOWED_EXT = [".pdf", ".txt", ".rtf", ".png", ".jpg", ".jpeg"];
const MAX_SIZE = 1_048_576; // 1 MB

async function extractFileContent(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    // Send to server for ephemeral extraction
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
    if (!res.ok) throw new Error("PDF extraction failed");
    const data = await res.json();
    return data.text ?? "";
  }

  if (file.type.startsWith("image/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(`[Image: ${file.name} — ${file.type}, base64 encoded]\n${base64.slice(0, 500)}...`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // TXT / RTF — read as text
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

interface Props {
  onSend: (text: string, attachments: Attachment[], searchEnabled: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  searchEnabled: boolean;
  onToggleSearch: () => void;
}

export function Composer({ onSend, disabled, placeholder, searchEnabled, onToggleSearch }: Props) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState("");
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !disabled && !processing;

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setFileError("");
    setProcessing(true);

    const newAttachments: Attachment[] = [];
    for (const file of Array.from(files)) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_TYPES[file.type] && !ALLOWED_EXT.includes(ext)) {
        setFileError(`${file.name}: unsupported type. Allowed: PDF, TXT, RTF, PNG, JPG`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        setFileError(`${file.name}: exceeds 1 MB limit`);
        continue;
      }
      try {
        const content = await extractFileContent(file);
        newAttachments.push({ name: file.name, type: file.type, content: content.slice(0, 8000) });
      } catch {
        setFileError(`Failed to read ${file.name}`);
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments].slice(0, 3));
    setProcessing(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const send = useCallback(() => {
    if (!canSend) return;
    onSend(text.trim(), attachments, searchEnabled);
    setText("");
    setAttachments([]);
    setFileError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [canSend, text, attachments, searchEnabled, onSend]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="w-full">
      {/* File attachments */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-2.5 py-1.5 rounded-lg">
              <span>{a.name}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                className="text-orange-400 hover:text-orange-700"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {fileError && (
        <p className="text-red-500 text-xs mb-2 px-1">{fileError}</p>
      )}

      {/* Composer box */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); autoResize(); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Message Nayab…"}
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none leading-relaxed min-h-[52px] max-h-[200px] overflow-y-auto"
        />

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-1">
          <div className="flex items-center gap-1">
            {/* File attach */}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.txt,.rtf,.png,.jpg,.jpeg,application/pdf,text/plain,text/rtf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={disabled || processing}
              className="text-stone-400 hover:text-orange-500 p-1.5 rounded-lg hover:bg-orange-50 transition-all disabled:opacity-40"
              title="Attach file (PDF, TXT, RTF, PNG, JPG — max 1 MB)"
            >
              <PaperclipIcon className="size-4" />
            </button>

            {/* Search toggle */}
            <button
              onClick={onToggleSearch}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                searchEnabled
                  ? "bg-orange-100 text-orange-600"
                  : "text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              }`}
              title="Toggle web search"
            >
              <GlobeIcon className="size-3.5" />
              <span>Search</span>
            </button>
          </div>

          {/* Send */}
          <button
            onClick={send}
            disabled={!canSend}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white size-9 flex items-center justify-center rounded-xl transition-all shadow-sm"
            title="Send (Enter)"
          >
            {processing ? (
              <span className="size-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
          </button>
        </div>
      </div>

      <p className="text-center text-[10px] text-stone-400 mt-2">
        Nayab can make mistakes. Verify important info. Free tier powered by{" "}
        <a href="https://github.com/Zulqurnain/offllama" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">
          offLLama
        </a>
      </p>
    </div>
  );
}
