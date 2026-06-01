/**
 * Layer 1: Pricing page
 */
import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Nayab Pricing — Free & Paid Plans",
  description: "Start for free with offLLama. Upgrade for GPT-4o, Claude Sonnet, and priority access.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-stone-900 mb-3">Simple, honest pricing</h1>
          <p className="text-stone-500 text-lg">Free forever with offLLama. Upgrade for the best models.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border-2 border-stone-200 rounded-2xl p-8">
            <div className="mb-4">
              <span className="text-sm font-medium text-stone-500 uppercase tracking-wide">Free</span>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-5xl font-extrabold text-stone-900">$0</span>
                <span className="text-stone-400 mb-1">/mo</span>
              </div>
            </div>
            <p className="text-stone-500 text-sm mb-6">No credit card required. Start chatting instantly.</p>
            <ul className="space-y-3 mb-8 text-sm text-stone-700">
              {[
                "offLLama (Qwen 2.5) — self-hosted",
                "3 messages/15 seconds",
                "PDF & file uploads (1 MB)",
                "DuckDuckGo web search",
                "No data retention",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/chat"
              className="block w-full text-center bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              Start for free
            </Link>
          </div>

          {/* Paid Plan */}
          <div className="bg-orange-500 border-2 border-orange-500 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
              POPULAR
            </div>
            <div className="mb-4">
              <span className="text-sm font-medium text-orange-200 uppercase tracking-wide">Pro</span>
              <div className="mt-1 flex items-end gap-1">
                <span className="text-5xl font-extrabold">$9</span>
                <span className="text-orange-200 mb-1">/mo</span>
              </div>
            </div>
            <p className="text-orange-100 text-sm mb-6">Everything in Free, plus premium models.</p>
            <ul className="space-y-3 mb-8 text-sm text-orange-50">
              {[
                "GPT-4o and GPT-4o Mini (OpenAI)",
                "Claude 3.5 Sonnet and Haiku (Anthropic)",
                "10 messages/15 seconds",
                "Priority access — no queue",
                "Longer context (2048 tokens)",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="text-white mt-0.5">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/chat"
              className="block w-full text-center bg-white text-orange-600 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors shadow-md"
            >
              Get Pro
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-stone-900 mb-6 text-center">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: "How do I activate the Pro plan?",
                a: "Purchase via Gumroad and enter your license key in the chat. Your key unlocks premium models instantly.",
              },
              {
                q: "Is my data private?",
                a: "Free tier (offLLama) runs entirely on our self-hosted server — no data goes to OpenAI or Anthropic. Paid tier sends messages to the respective provider.",
              },
              {
                q: "What models are included?",
                a: "Free: Qwen 2.5 via offLLama. Pro: GPT-4o, GPT-4o Mini, Claude 3.5 Sonnet, Claude 3 Haiku.",
              },
            ].map((item) => (
              <div key={item.q} className="bg-white border border-stone-100 rounded-xl p-5">
                <h3 className="font-semibold text-stone-900 mb-1">{item.q}</h3>
                <p className="text-stone-500 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-400">
        <p>© {new Date().getFullYear()} Nayab — Powered by offLLama</p>
      </footer>
    </div>
  );
}
