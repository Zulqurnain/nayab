import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Nayab — Private AI Chat powered by offLLama",
  description: "Fast, private AI chat. Free tier runs on your own server. Upgrade for GPT-4o and Claude Sonnet.",
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

const FEATURES = [
  {
    title: "Streaming responses",
    desc: "Token-by-token output — no waiting for a full reply. Feels instantaneous.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Zero data retention",
    desc: "Free tier is 100% self-hosted on offLLama. Conversations never touch a third-party server.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    title: "File and PDF uploads",
    desc: "Upload any document and ask questions about it. Processed ephemerally — nothing is stored.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
      </svg>
    ),
  },
  {
    title: "Web search",
    desc: "Enable real-time web search via DuckDuckGo. Get current answers without leaving the chat.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
      </svg>
    ),
  },
  {
    title: "Five premium models",
    desc: "GPT-4o, GPT-4o Mini, Claude Sonnet, and Claude Haiku available on the Pro plan.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    title: "Text to speech",
    desc: "Listen to any response with browser-native text-to-speech. No plugins or extensions needed.",
    icon: (
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    num: "01",
    title: "Open the chat",
    desc: "No account required. Visit the chat page and start asking questions immediately.",
  },
  {
    num: "02",
    title: "Ask anything",
    desc: "Upload a PDF, enable web search, or type a question. Everything works on the free tier.",
  },
  {
    num: "03",
    title: "Upgrade when ready",
    desc: "Buy a license key on Gumroad and enter it in the chat to unlock GPT-4o and Claude.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900">
      <Nav />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-1.5 text-sm text-stone-600 font-medium mb-8 shadow-sm">
            <span className="size-1.5 rounded-full bg-green-500" />
            Free — no sign-up required
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-[1.08] text-stone-900">
            Private AI chat,<br />
            <span className="text-orange-500">no compromises</span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Nayab runs on{" "}
            <a href="https://github.com/Zulqurnain/offllama" className="text-stone-900 underline underline-offset-2 font-medium" target="_blank" rel="noopener noreferrer">
              offLLama
            </a>
            {" "}— a self-hosted inference engine. Your conversations stay on your server.
            Upgrade once to access GPT-4o and Claude.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-16">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-stone-800 transition-colors"
            >
              Start chatting free
              <ArrowIcon className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-6 py-3 rounded-xl font-semibold text-sm hover:border-stone-300 transition-colors"
            >
              See pricing
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-stone-400">
            {["Open source", "Self-hosted", "Privacy-first", "No tracking"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckIcon className="size-3.5 text-stone-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-y border-stone-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">
              Built for real conversations
            </h2>
            <p className="text-stone-500 max-w-lg mx-auto">
              Every feature works on the free plan. No upsell walls, no artificial limitations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-stone-50 border border-stone-200/60 rounded-2xl p-6 hover:bg-white hover:shadow-md hover:border-stone-200 transition-all"
              >
                <div className="size-9 rounded-xl bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-stone-900 mb-1.5 text-sm">{f.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-stone-900 mb-3">How it works</h2>
            <p className="text-stone-500">From zero to your first AI conversation in under a minute.</p>
          </div>
          <div className="space-y-3">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-start gap-6 bg-white border border-stone-200 rounded-2xl p-6">
                <div className="shrink-0 font-mono text-xs font-bold text-stone-300 pt-0.5 w-6">{s.num}</div>
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
      <section className="py-24 px-4 bg-stone-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-stone-400 text-lg mb-8">
            Free forever. No account required. Upgrade when you need more powerful models.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/chat"
              className="bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Open Nayab Chat
            </Link>
            <a
              href="https://ko-fi.com/zulqurnainjj"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Support on Ko-fi
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-orange-500" />
            <span className="font-semibold text-stone-900 text-sm">Nayab</span>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-stone-400">
            <Link href="/pricing" className="hover:text-stone-700 transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-stone-700 transition-colors">Dashboard</Link>
            <a href="https://github.com/Zulqurnain/offllama" target="_blank" rel="noopener noreferrer" className="hover:text-stone-700 transition-colors">GitHub</a>
            <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer" className="hover:text-stone-700 transition-colors">Ko-fi</a>
            <a href="/llms.txt" className="hover:text-stone-700 transition-colors">llms.txt</a>
          </nav>
        </div>
        <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-stone-100 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Nayab · Built by{" "}
          <a href="https://zulqurnainj.com" className="hover:text-stone-700">Zulqurnain Haider</a>
          {" "}· Powered by{" "}
          <a href="https://github.com/Zulqurnain/offllama" className="hover:text-stone-700">offLLama</a>
        </div>
      </footer>
    </div>
  );
}
