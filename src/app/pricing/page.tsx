import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Nayab Pricing — Free & Pro Plans",
  description: "Start free with offLLama. Upgrade for GPT-4o, Claude Sonnet, and more.",
};

const FREE_FEATURES = [
  { text: "Qwen 2.5 via offLLama (self-hosted)", included: true },
  { text: "File uploads: PDF, TXT, RTF, PNG, JPG (1 MB)", included: true },
  { text: "DuckDuckGo web search", included: true },
  { text: "Text-to-speech (browser-native)", included: true },
  { text: "No sign-up required", included: true },
  { text: "~20 messages/minute", included: true },
  { text: "GPT-4o, Claude Sonnet", included: false },
  { text: "GPT-4o Mini, Claude Haiku", included: false },
  { text: "Priority inference", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "GPT-4o (OpenAI)", included: true },
  { text: "GPT-4o Mini (OpenAI)", included: true },
  { text: "Claude 3.5 Sonnet (Anthropic)", included: true },
  { text: "Claude 3 Haiku (Anthropic)", included: true },
  { text: "Qwen 2.5 via offLLama", included: true },
  { text: "~300 messages/day fair use", included: true },
  { text: "Priority inference", included: true },
  { text: "Support open-source AI", included: true },
];

const FAQ = [
  {
    q: "What does 'fair use' mean?",
    a: "The Pro plan is designed for personal or professional daily use — roughly 300 messages per day. We don't hard-cut you off, but automated bulk usage may be throttled to protect service quality.",
  },
  {
    q: "How does the license key work?",
    a: "After purchasing on Gumroad you'll receive a license key by email. Open Nayab, click 'Upgrade', paste your key, and you'll instantly have access to all premium models. Stored in your browser — no account needed.",
  },
  {
    q: "Can I use my key on multiple devices?",
    a: "Yes. Enter your license key on any device running Nayab — it works everywhere.",
  },
  {
    q: "Do you store my conversations?",
    a: "No. The free tier (offLLama) processes everything server-side and never writes conversations to disk. The paid tier uses OpenAI/Anthropic APIs which have their own privacy policies — but Nayab itself stores nothing.",
  },
  {
    q: "What if I want a refund?",
    a: "Gumroad handles all billing. Contact support@gumroad.com within 30 days if you're not satisfied.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      <main className="flex-1 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 mb-4">Simple, honest pricing</h1>
            <p className="text-stone-500 text-xl max-w-lg mx-auto">
              Start free. Pay once if you want GPT-4o and Claude. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-16">
            {/* Free */}
            <div className="bg-white border-2 border-stone-200 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Free</p>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-5xl font-extrabold text-stone-900">$0</span>
                  <span className="text-stone-400 mb-1.5 text-sm">/month</span>
                </div>
                <p className="text-stone-500 text-sm">No credit card. Start chatting instantly.</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 shrink-0 ${f.included ? "text-green-500" : "text-stone-300"}`}>
                      {f.included ? "✓" : "✕"}
                    </span>
                    <span className={f.included ? "text-stone-700" : "text-stone-400 line-through"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/chat" className="block w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold transition-colors">
                Start for free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-stone-900 border-2 border-stone-900 rounded-2xl p-8 flex flex-col overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent pointer-events-none" />
              <div className="absolute top-4 right-4">
                <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">POPULAR</span>
              </div>
              <div className="mb-6 relative">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">Pro</p>
                <div className="flex items-end gap-1.5 mb-2">
                  <span className="text-5xl font-extrabold text-white">$10</span>
                  <span className="text-stone-400 mb-1.5 text-sm">/month</span>
                </div>
                <p className="text-stone-400 text-sm">One license key. Works on all your devices.</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1 relative">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 shrink-0 text-orange-400">✓</span>
                    <span className="text-stone-300">{f.text}</span>
                  </li>
                ))}
              </ul>
              <div className="relative space-y-3">
                <a
                  href="https://zulqurnainjj.gumroad.com/l/nayab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full bg-orange-500 hover:bg-orange-400 text-white py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-orange-900/30"
                >
                  Get Pro on Gumroad — $10/mo
                </a>
                <p className="text-center text-xs text-stone-500">
                  Already have a key?{" "}
                  <Link href="/chat" className="text-orange-400 hover:underline">Open chat → click Upgrade</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Ko-fi */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="text-4xl shrink-0">☕</div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-stone-900 mb-1">Support without a subscription</h3>
                <p className="text-stone-500 text-sm">A one-time Ko-fi helps keep the servers running. Every coffee counts.</p>
              </div>
              <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer"
                className="shrink-0 bg-[#FF5E5B] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Buy a Coffee →
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">Frequently asked questions</h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="bg-white border border-stone-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-stone-900 mb-2">{item.q}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-400">
        <Link href="/" className="hover:text-orange-500 transition-colors">← Back to home</Link>
      </footer>
    </div>
  );
}
