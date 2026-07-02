"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEffect, useState, useMemo } from "react";

type EditorProps = {
  docId: string;
  token?: string;
  userName?: string;
  userColor?: string;
};

export function CollabEditor({
  docId,
  token,
  userName = "Anonymous",
  userColor = "#ff0000",
}: EditorProps) {
  const [ready, setReady] = useState(false);

  const { provider, ydoc } = useMemo(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_COLLAB_URL ??
      (typeof window !== "undefined"
        ? `ws://${window.location.hostname}:4000`
        : "ws://localhost:4000");

    const doc = new Y.Doc();

    const p = new HocuspocusProvider({
      url: wsUrl,
      name: docId,
      document: doc,
      token: token ?? "",
      connect: Boolean(token),
      onConnect: () => setReady(true),
      onDisconnect: () => setReady(false),
      onSynced: () => setReady(true),
    });

    return { provider: p, ydoc: doc };
  }, [docId, token]);

  useEffect(() => {
    return () => {
      provider?.destroy();
      ydoc?.destroy();
    };
  }, [provider, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: { name: userName, color: userColor },
      }),
    ],
    editable: Boolean(token),
  });

  if (!editor) {
    return <p className="p-4 text-sm opacity-70">Loading editor…</p>;
  }

  return (
    <div className="rounded border border-black/10 dark:border-white/10">
      <div className="flex items-center gap-2 px-3 py-2 text-xs opacity-70 border-b border-black/10 dark:border-white/10">
        <span>{ready ? "Connected" : "Connecting…"}</span>
        <span className="mx-1">·</span>
        <span>{docId}</span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
