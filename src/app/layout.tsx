import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nayab — Free AI Chat powered by offLLama",
  description: "Nayab is a free, privacy-first AI chat assistant powered by offLLama — a self-hosted inference engine. No sign-up, no data retention, chat freely.",
  keywords: ["AI chat", "free AI", "offLLama", "ChatGPT alternative", "privacy AI"],
  openGraph: {
    title: "Nayab — Free AI Chat",
    description: "Fast, private AI chat powered by offLLama. No sign-up required.",
    url: "https://chat.zulqurnainj.com",
    siteName: "Nayab",
    type: "website",
  },
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
        {children}
      </body>
    </html>
  );
}
