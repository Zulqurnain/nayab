"use client";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/chat/api/auth">
      {children}
    </SessionProvider>
  );
}
