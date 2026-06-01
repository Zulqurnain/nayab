import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Nayab — Live Demo of llmizeOFF · Self-Hosted AI Runtime",
  description: "Try llmizeOFF live. A self-hostable LLM runtime for VPS, Android, cPanel, and local systems. No subscriptions, no lock-in.",
  keywords: ["llmizeOFF", "AI chat", "self-hosted AI", "offllama", "ChatGPT alternative", "privacy AI", "VPS AI"],
  openGraph: {
    title: "Nayab — Live Demo of llmizeOFF",
    description: "Try llmizeOFF live. Self-hosted LLM runtime for VPS, Android, and local systems.",
    url: "https://zulqurnainj.com/chat",
    siteName: "Nayab",
    type: "website",
  },
  twitter: { card: "summary", title: "Nayab — llmizeOFF Demo", description: "Try llmizeOFF — a self-hosted LLM runtime. No subscriptions, no lock-in." },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#fafaf9] text-[#1c1917] antialiased h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
