/**
 * Layer 1: Landing/home page — not the chat directly.
 * Material Orange + white theme.
 */
import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm text-orange-700 font-medium mb-6">
          <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
          Free AI chat — no sign-up required
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-stone-900 mb-4 leading-tight max-w-2xl">
          Meet <span className="text-orange-500">Nayab</span>,<br />
          your private AI assistant
        </h1>

        <p className="text-lg text-stone-500 max-w-xl mb-8 leading-relaxed">
          Fast, private AI chat powered by{" "}
          <a
            href="https://github.com/Zulqurnain/offllama"
            className="text-orange-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            offLLama
          </a>
          . No data retention. Upgrade for GPT-4o and Claude Sonnet.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/chat"
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold text-base hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
          >
            Start chatting — it&apos;s free
          </Link>
          <Link
            href="/pricing"
            className="bg-white border border-stone-200 text-stone-700 px-6 py-3 rounded-xl font-semibold text-base hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            See pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-4 py-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            icon: "⚡",
            title: "Instant responses",
            desc: "Streaming token-by-token responses. No waiting for a full reply.",
          },
          {
            icon: "🔒",
            title: "100% private",
            desc: "Free tier runs on self-hosted offLLama. Your conversations never leave the server.",
          },
          {
            icon: "📎",
            title: "File & PDF support",
            desc: "Upload documents and ask questions about them. No extra setup needed.",
          },
          {
            icon: "🌐",
            title: "Web search",
            desc: "Enable web search to get up-to-date answers from the internet.",
          },
          {
            icon: "🤖",
            title: "Multiple models",
            desc: "GPT-4o, Claude Sonnet, and more on the paid plan. Free tier uses offLLama.",
          },
          {
            icon: "💬",
            title: "No sign-up needed",
            desc: "Start chatting instantly. Create an account only when you want to save history.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-stone-900 mb-1">{f.title}</h3>
            <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-orange-500 py-16 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Ready to chat?</h2>
        <p className="text-orange-100 mb-6">No credit card. No sign-up. Just open it and go.</p>
        <Link
          href="/chat"
          className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors shadow-md"
        >
          Open Nayab Chat
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <a href="/llms.txt" className="hover:text-orange-500">llms.txt</a>
          <a href="/sitemap.xml" className="hover:text-orange-500">Sitemap</a>
          <Link href="/pricing" className="hover:text-orange-500">Pricing</Link>
          <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500">Support</a>
        </div>
        <p>© {new Date().getFullYear()} Nayab — Powered by offLLama</p>
      </footer>
    </div>
  );
}
