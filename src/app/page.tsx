import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Nayab — Private AI Chat powered by offLLama",
  description: "Fast, private AI chat. Free tier runs on your own server. Upgrade for GPT-4o and Claude Sonnet.",
};

const FEATURES = [
  { icon: "⚡", title: "Streaming responses", desc: "Token-by-token output — no waiting. Feels instant." },
  { icon: "🔒", title: "Zero data retention", desc: "Free tier is 100% self-hosted. Your chats never leave the server." },
  { icon: "📎", title: "File & PDF uploads", desc: "Ask questions about any document — up to 1 MB, processed ephemerally." },
  { icon: "🌐", title: "Web search built-in", desc: "Real-time DuckDuckGo search with no extra setup or API key." },
  { icon: "🤖", title: "5 premium models", desc: "GPT-4o, GPT-4o Mini, Claude Sonnet, Claude Haiku on the Pro plan." },
  { icon: "🎙️", title: "Text-to-speech", desc: "Listen to any response with browser-native TTS — no plugins needed." },
];

const STEPS = [
  { num: "1", title: "Open the chat", desc: "No sign-up. No credit card. Just click and start talking to Nayab." },
  { num: "2", title: "Ask anything", desc: "Upload files, enable web search, or just chat — it all works out of the box." },
  { num: "3", title: "Upgrade if you want more", desc: "One-time license key from Gumroad unlocks GPT-4o and Claude Sonnet." },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900">
      <Nav />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-100 rounded-full blur-3xl opacity-40 -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-50 rounded-full blur-3xl opacity-60 translate-y-1/2" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm text-orange-700 font-medium mb-8">
            <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
            Free — no sign-up required
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            Meet <span className="text-orange-500">Nayab</span> —<br className="hidden sm:block" />
            <span className="text-stone-500 font-semibold text-4xl sm:text-5xl">your private AI assistant</span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Powered by{" "}
            <a href="https://github.com/Zulqurnain/offllama" className="text-orange-500 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
              offLLama
            </a>{" "}
            — a self-hosted inference engine. No subscriptions to track you, no data sold.
            Upgrade once to unlock GPT-4o and Claude.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-7 py-3.5 rounded-2xl font-semibold text-base hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
            >
              Start chatting free
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-7 py-3.5 rounded-2xl font-semibold text-base hover:border-orange-300 hover:text-orange-600 transition-colors"
            >
              View pricing
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-400">
            {["Open source", "Self-hosted inference", "Privacy-first", "No tracking"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-green-500">✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white border-y border-stone-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Everything you need to chat with AI</h2>
            <p className="text-stone-500 text-lg">No dark patterns — every feature works on the free plan.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-stone-50 border border-stone-100 rounded-2xl p-6 hover:border-orange-200 hover:bg-orange-50/30 transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-stone-900 mb-1.5">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">Up and running in seconds</h2>
            <p className="text-stone-500">Three steps to your first AI conversation.</p>
          </div>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-start gap-5 bg-white border border-stone-200 rounded-2xl p-6">
                <div className="size-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {s.num}
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900 mb-1">{s.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold mb-4">Ready to try it?</h2>
          <p className="text-orange-100 text-lg mb-8">Free forever. No account required. Upgrade anytime.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/chat" className="bg-white text-orange-600 px-7 py-3.5 rounded-2xl font-semibold hover:bg-orange-50 transition-colors shadow-lg">
              Open Nayab Chat
            </Link>
            <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer"
              className="bg-orange-400/30 hover:bg-orange-400/50 text-white border border-orange-300/40 px-7 py-3.5 rounded-2xl font-semibold transition-colors">
              ☕ Support on Ko-fi
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <svg className="size-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900">Nayab</span>
            <span className="text-stone-400 text-sm">— Powered by offLLama</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-400">
            <Link href="/pricing" className="hover:text-orange-500 transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-orange-500 transition-colors">Dashboard</Link>
            <a href="/llms.txt" className="hover:text-orange-500 transition-colors">llms.txt</a>
            <a href="https://github.com/Zulqurnain/offllama" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">GitHub</a>
            <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">Ko-fi</a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-4 pt-4 border-t border-stone-100 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Nayab · Built by{" "}
          <a href="https://zulqurnainj.com" className="hover:text-orange-500">Zulqurnain Haider</a>
          {" "}· Powered by <a href="https://github.com/Zulqurnain/offllama" className="hover:text-orange-500">offLLama</a>
        </div>
      </footer>
    </div>
  );
}
