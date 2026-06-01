import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Nayab Pricing — Free & Pro Plans",
  description: "Start free with offLLama. Upgrade for GPT-4o, Claude Sonnet, and more.",
};

function Check({ included }: { included: boolean }) {
  if (included) {
    return (
      <svg className="size-4 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return (
    <svg className="size-4 text-stone-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const FREE_FEATURES = [
  { text: "Qwen 2.5 via offLLama (self-hosted)", included: true },
  { text: "File uploads: PDF, TXT, RTF, PNG, JPG up to 1 MB", included: true },
  { text: "DuckDuckGo web search", included: true },
  { text: "Browser-native text-to-speech", included: true },
  { text: "No sign-up required", included: true },
  { text: "GPT-4o and Claude Sonnet", included: false },
  { text: "GPT-4o Mini and Claude Haiku", included: false },
  { text: "Priority inference", included: false },
];

const PRO_FEATURES = [
  { text: "Everything in Free", included: true },
  { text: "GPT-4o (OpenAI)", included: true },
  { text: "GPT-4o Mini (OpenAI)", included: true },
  { text: "Claude 3.5 Sonnet (Anthropic)", included: true },
  { text: "Claude 3 Haiku (Anthropic)", included: true },
  { text: "Qwen 2.5 via offLLama", included: true },
  { text: "Approximately 300 messages per day", included: true },
  { text: "Priority inference", included: true },
];

const FAQ = [
  {
    q: "What does 'fair use' mean?",
    a: "The Pro plan is designed for personal or professional daily use — roughly 300 messages per day. We don't hard-cut you off, but automated bulk usage may be throttled to protect service quality for everyone.",
  },
  {
    q: "How does the license key work?",
    a: "After purchasing on Gumroad you'll receive a license key by email. Open Nayab, click Upgrade in the chat, paste your key, and you'll instantly have access to all premium models. The key is stored in your browser — no account needed.",
  },
  {
    q: "Can I use my license on multiple devices?",
    a: "Yes. Enter your license key on any device running Nayab — it works across all your devices.",
  },
  {
    q: "Do you store my conversations?",
    a: "No. The free tier uses offLLama, which processes requests server-side but never writes conversations to disk. The paid tier routes through OpenAI or Anthropic APIs, which have their own privacy policies — but Nayab itself stores nothing.",
  },
  {
    q: "What if I want a refund?",
    a: "Gumroad handles all billing. Contact support@gumroad.com within 30 days of purchase if you're not satisfied.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      <main className="flex-1 px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4 tracking-tight">
              Simple, honest pricing
            </h1>
            <p className="text-stone-500 text-lg max-w-md mx-auto">
              Start free. Pay once if you want GPT-4o and Claude. No hidden fees, no trials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto mb-16">
            {/* Free */}
            <div className="bg-white border border-stone-200 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Free</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-5xl font-bold text-stone-900">$0</span>
                  <span className="text-stone-400 mb-1.5">/month</span>
                </div>
                <p className="text-stone-500 text-sm mt-2">No credit card required. Start immediately.</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <Check included={f.included} />
                    <span className={f.included ? "text-stone-700" : "text-stone-400 line-through"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/" className="block w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-xl font-semibold transition-colors text-sm">
                Start for free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-stone-900 border border-stone-900 rounded-2xl p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute top-4 right-4">
                <span className="bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</span>
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Pro</p>
                <div className="flex items-end gap-1.5">
                  <span className="text-5xl font-bold text-white">$10</span>
                  <span className="text-stone-400 mb-1.5">/month</span>
                </div>
                <p className="text-stone-400 text-sm mt-2">One license key, works on all your devices.</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <svg className="size-4 text-orange-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-stone-300">{f.text}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2.5">
                <a
                  href="https://zulqurnain45.gumroad.com/l/nayab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-400 text-white py-3.5 rounded-xl font-semibold transition-colors text-sm"
                >
                  Get Pro on Gumroad — $10/month
                </a>
                <p className="text-center text-xs text-stone-500">
                  Have a license key?{" "}
                  <Link href="/" className="text-orange-400 hover:underline">Open chat and click Upgrade</Link>
                </p>
              </div>
            </div>
          </div>

          {/* Ko-fi */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="size-12 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                <svg className="size-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-semibold text-stone-900 mb-1">Support without a subscription</h3>
                <p className="text-stone-500 text-sm">Like the project? A one-time Ko-fi helps keep the servers running and the project maintained.</p>
              </div>
              <a
                href="https://ko-fi.com/zulqurnainjj"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                Support on Ko-fi
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-stone-900 mb-8 text-center">Questions & answers</h2>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <div key={item.q} className="bg-white border border-stone-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-stone-900 mb-2 text-sm">{item.q}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-400">
        <Link href="/" className="hover:text-stone-700 transition-colors">← Back to home</Link>
      </footer>
    </div>
  );
}
