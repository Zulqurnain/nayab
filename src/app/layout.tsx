import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Nayab — Private AI Chat powered by offLLama",
  description: "Fast, private AI chat powered by offLLama. No sign-up required. Upgrade for GPT-4o and Claude Sonnet.",
  keywords: ["AI chat", "free AI", "offLLama", "ChatGPT alternative", "privacy AI", "self-hosted AI"],
  openGraph: {
    title: "Nayab — Private AI Chat",
    description: "Fast, private AI chat powered by offLLama. No sign-up required.",
    url: "https://chat.zulqurnainj.com",
    siteName: "Nayab",
    type: "website",
  },
  twitter: { card: "summary", title: "Nayab — Private AI Chat", description: "Fast, private AI chat powered by offLLama." },
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
