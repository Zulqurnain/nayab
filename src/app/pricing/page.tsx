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
  // Privacy & Data
  {
    q: "Do you store my conversations?",
    a: "No. Nayab stores nothing. The free tier runs on offLLama — inference happens on the server and the result is streamed back, but nothing is written to disk. The paid tier routes through OpenAI or Anthropic APIs under your implicit agreement with them, but Nayab itself never logs, stores, or analyses your messages.",
  },
  {
    q: "Can Nayab see what I'm typing?",
    a: "Free tier messages are processed by our self-hosted offLLama server (Qwen 2.5) and never leave that server in a readable form. Pro tier messages are forwarded to OpenAI or Anthropic's APIs — the same path as using ChatGPT or Claude directly. We never read or log those payloads.",
  },
  {
    q: "Is Nayab private compared to ChatGPT?",
    a: "Yes, meaningfully so. ChatGPT and similar cloud services store conversations and may use them to improve their models (unless you opt out). Nayab stores nothing on any tier, and the free tier never leaves our server at all. No conversation history, no training data harvesting.",
  },
  {
    q: "Does Nayab collect analytics or telemetry?",
    a: "No. Nayab does not phone home, track usage, or collect analytics. Your browser session is yours.",
  },
  // Pricing & Billing
  {
    q: "Is the $10 Pro license really one-time, or will I be charged again?",
    a: "Truly one-time. $10 buys the license key permanently. There is no subscription, no annual renewal, no hidden fees. ChatGPT Plus costs $20 every month — Nayab Pro costs $10 once.",
  },
  {
    q: "How does the license key work?",
    a: "After purchasing on Gumroad you receive a license key by email. Open Nayab, click Upgrade in the chat header, paste your key, and all premium models unlock instantly. The key is stored in your browser — no account required.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Payments go through Gumroad, which accepts major credit cards, PayPal, Apple Pay, and Google Pay.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes. Gumroad handles all billing. Contact support@gumroad.com within 30 days of purchase if you're not satisfied — no questions asked.",
  },
  {
    q: "What does 'fair use' mean for the free tier?",
    a: "The free tier is rate-limited to roughly 20 requests per minute to keep the server responsive for everyone. There's no daily message cap — just don't run automated scripts against it.",
  },
  // Model quality
  {
    q: "Is Qwen 2.5 (the free model) actually capable, or is it a watered-down model?",
    a: "Qwen 2.5 is a full, production-quality open-source LLM from Alibaba Research. It handles coding, writing, summarisation, and reasoning well. It's not a toy — it's the same model class developers self-host for serious work. For most everyday tasks you won't hit its limits.",
  },
  {
    q: "When should I use Pro (GPT-4o / Claude) vs the free Qwen model?",
    a: "Use Qwen for drafting, brainstorming, coding, Q&A, and summaries. Switch to GPT-4o or Claude for complex multi-step reasoning, nuanced long-form writing, or tasks where accuracy on hard questions really matters. You can switch models per conversation in-app.",
  },
  {
    q: "Do AI models on Nayab hallucinate or make mistakes?",
    a: "Yes — all large language models can produce confident-sounding incorrect answers. Always verify important information from a primary source. Pro gives you access to Claude 3.5 Sonnet, which has one of the lowest hallucination rates of any public model, and GPT-4o for a second opinion.",
  },
  {
    q: "How does Nayab compare to ChatGPT Plus?",
    a: "ChatGPT Plus is $20/month, cloud-only, stores your conversations, and may use them to improve OpenAI's models. Nayab Pro is $10 one-time, stores nothing, and gives you access to the same GPT-4o model plus Claude Sonnet. If privacy and cost matter to you, Nayab wins. If you want voice, image generation, or deep integrations, ChatGPT is ahead.",
  },
  // Devices & access
  {
    q: "Can I use my Pro license on multiple devices?",
    a: "Yes. Enter your license key on any device — it works everywhere. There's no device limit.",
  },
  {
    q: "Does Nayab work on mobile?",
    a: "The web app is responsive and works on mobile browsers, but it's optimised for desktop. A dedicated mobile app is on the roadmap.",
  },
  // Conversations & history
  {
    q: "How do I save an important conversation?",
    a: "Copy and paste the conversation text, or select all and save it as a document. Nayab intentionally doesn't auto-save conversations — it's a privacy feature, not a bug. If you need history, keep a note.",
  },
  {
    q: "Can I share a conversation with someone?",
    a: "Not with a shareable link — Nayab has no cloud backend to host shared chats. Copy the conversation text and send it directly. The recipient can paste it into their own Nayab session to continue from context.",
  },
  // Technical
  {
    q: "What is offLLama and why does it matter?",
    a: "offLLama is an open-source library built by Zulqurnain Haider that wraps llama.cpp to run LLMs on standard shared hosting and VPS servers without a GPU. It's what makes the free tier possible — instead of paying OpenAI per token, the model runs on our own server. Source: github.com/Zulqurnain/offllama.",
  },
  {
    q: "Does Nayab have an API I can use in my own apps?",
    a: "Not yet. Nayab is a consumer chat interface, not an API service. For programmatic LLM access, check out the offLLama library directly or use OpenAI/Anthropic APIs.",
  },
  {
    q: "Will there be more features — file uploads, voice, image generation?",
    a: "File uploads (PDF, TXT, images) are already supported in the free tier. Voice and image generation are planned. Features are shipped based on demand — if something matters to you, open a GitHub issue or reach out.",
  },
  {
    q: "What if the service goes down or Nayab shuts down?",
    a: "The free tier depends on our server being online. If the service ever shuts down, Pro users still have valid OpenAI/Anthropic API keys — you can use those directly. We're committed to keeping Nayab running, but your Pro license is not locked to us.",
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
