"use client";

import { CollabEditor } from "@/components/CollabEditor";

type Props = {
  initialId: string;
};

export default function DocClient({ initialId }: Props) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("nayab_token") ?? undefined
      : undefined;

  return (
    <CollabEditor
      docId={initialId}
      token={token}
      userName="Editor"
      userColor="#ff7b00"
    />
  );
}
