import Link from "next/link";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Nayab — Live Demo of llmizeOFF · Self-Hosted AI Runtime",
  description: "Try llmizeOFF live. A self-hostable LLM runtime for VPS, Android, cPanel, and local systems. No subscriptions, no lock-in.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9] text-stone-900">
      <Nav />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-orange-100 rounded-full blur-3xl opacity-25" />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-1.5 text-sm text-stone-600 font-medium mb-8 shadow-sm">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            Live demo · powered by llmizeOFF
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4 leading-[1.08]">
            Run your own AI.<br />
            <span className="text-orange-500">No cloud required.</span>
          </h1>

          <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-4 leading-relaxed">
            <span className="font-semibold text-stone-800">Nayab</span> is the hosted demo of{" "}
            <a href="https://github.com/Zulqurnain/offllama" className="text-orange-500 font-semibold hover:underline" target="_blank" rel="noopener noreferrer">
              llmizeOFF
            </a>
            {" "}— an open-source LLM runtime designed to run on VPS servers, cPanel hosting, Android apps, and local machines without subscriptions or external dependencies.
          </p>

          <p className="text-sm text-stone-400 mb-10">
            Try it free · 4 prompts without sign-up · unlimited after free account
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-14">
            <Link href="/chat"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-stone-800 transition-colors shadow-md">
              Try Nayab Live
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a href="https://github.com/Zulqurnain/offllama" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-stone-200 text-stone-700 px-7 py-3.5 rounded-xl font-semibold hover:border-stone-300 transition-colors">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              llmizeOFF on GitHub
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-stone-400">
            {[
              "Self-hosted",
              "VPS & cPanel ready",
              "Android compatible",
              "No subscriptions",
              "Offline-first",
            ].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="size-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* What is llmizeOFF */}
      <section className="py-20 px-4 bg-white border-y border-stone-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">The Runtime</p>
            <h2 className="text-3xl font-bold text-stone-900 mb-3">What is llmizeOFF?</h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              llmizeOFF is the self-hosted inference engine behind Nayab. It is designed to be deployed anywhere — from a $5/month VPS to a cPanel shared host to an Android device — without cloud dependencies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "VPS & cPanel hosting",
                desc: "Run on any Linux VPS. Designed to work even on shared cPanel environments with limited resources.",
                icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                  </svg>
                ),
              },
              {
                title: "Android & mobile apps",
                desc: "Embed llmizeOFF in Android apps via JNI bindings. Run private AI on-device — no server needed.",
                icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
                  </svg>
                ),
              },
              {
                title: "Local tools & CLI",
                desc: "Use as a local inference API for scripts, agents, and developer tooling. Zero cloud round-trips.",
                icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
              },
              {
                title: "Real token streaming",
                desc: "Tokens stream to the client as they are generated — first word appears in seconds, not after a full wait.",
                icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
              },
              {
                title: "Private by design",
                desc: "All inference happens on your machine. No conversation ever leaves your server. No telemetry.",
                icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                ),
              },
              {
                title: "No subscriptions",
                desc: "Self-host once. Run forever. No monthly fees, no API quotas, no vendor lock-in of any kind.",
                icon: (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
                  </svg>
                ),
              },
            ].map((f) => (
              <div key={f.title} className="bg-stone-50 border border-stone-200/60 rounded-2xl p-6 hover:bg-white hover:shadow-md transition-all">
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

      {/* Model recommendation callout */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
            <div className="relative">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Model recommendation</p>
              <h3 className="text-2xl font-bold mb-3">Qwen 2.5-1.5B · Best for CPU-only VPS</h3>
              <p className="text-stone-400 mb-5 leading-relaxed text-sm">
                After testing 0.5B, 1.5B, 3B, and 4B models on a 6-core AMD EPYC with 12GB RAM, Qwen 2.5-1.5B delivers the best balance of response quality and speed. At Q4_K_M quantization it fits in ~1.1GB RAM, generates at 4-6 tokens/second with AVX2, and streams first tokens in 3-5 seconds. Larger models like Phi-3.5-mini (3.8B) or MiniCPM (4B) time out on CPU for interactive chat.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Model size", value: "1.1 GB" },
                  { label: "First token", value: "3-5 s" },
                  { label: "Throughput", value: "4-6 tok/s" },
                ].map((s) => (
                  <div key={s.label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ko-fi / Pre-order section */}
      <section className="py-16 px-4 bg-white border-t border-stone-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">Support the project</p>
          <h2 className="text-3xl font-bold text-stone-900 mb-4">llmizeOFF Pro is coming</h2>
          <p className="text-stone-500 mb-3 max-w-xl mx-auto leading-relaxed">
            The core runtime stays open-source and free. The upcoming paid edition adds a visual dashboard, one-click model management, multi-user support, Android SDK, and priority support — built for teams and indie devs who want a fully managed self-hosted AI stack.
          </p>
          <p className="text-stone-400 text-sm mb-8">
            Pre-orders and Ko-fi supporters shape what gets built first.
          </p>

          <div className="flex flex-wrap gap-3 justify-center">
            <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md">
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.728-1.003-.921-2.198-.636-3.554.285-1.356 1.558-2.362 2.924-2.426 1.364-.064 2.673.47 3.18 1.372l.528.986.616-.96c.602-.956 1.711-1.481 2.941-1.389 1.23.092 2.27.899 2.504 2.098.27 1.361-.065 2.574-.594 3.918z"/>
              </svg>
              Support on Ko-fi
            </a>
            <a href="https://github.com/Zulqurnain/offllama" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-3 rounded-xl font-semibold transition-colors">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              Star on GitHub
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            {[
              { label: "Free forever", items: ["Core runtime (open-source)", "VPS self-hosting", "GGUF model support", "REST API"] },
              { label: "Pro (coming soon)", items: ["Visual dashboard", "Model manager", "Multi-user auth", "Android SDK", "Priority support"] },
              { label: "How to support", items: ["Ko-fi: @zulqurnainjj", "Star on GitHub", "Share with developers", "Submit feedback"] },
            ].map((col) => (
              <div key={col.label} className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">{col.label}</p>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-stone-700">
                      <svg className="size-3.5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-stone-900 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Try it now — no account needed</h2>
          <p className="text-stone-400 mb-8">4 free prompts. Then sign up free for unlimited access.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/chat"
              className="bg-orange-500 hover:bg-orange-400 text-white px-7 py-3.5 rounded-xl font-semibold transition-colors shadow-md">
              Open Nayab Chat
            </Link>
            <Link href="/pricing"
              className="bg-white/10 hover:bg-white/15 text-white border border-white/20 px-7 py-3.5 rounded-xl font-semibold transition-colors">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 py-8 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-orange-500" />
            <span className="font-semibold text-stone-900 text-sm">Nayab</span>
            <span className="text-stone-400 text-xs">· demo of llmizeOFF</span>
          </div>
          <nav className="flex flex-wrap items-center gap-5 text-sm text-stone-400">
            <Link href="/chat" className="hover:text-stone-700 transition-colors">Chat</Link>
            <Link href="/pricing" className="hover:text-stone-700 transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-stone-700 transition-colors">Dashboard</Link>
            <a href="https://github.com/Zulqurnain/offllama" target="_blank" rel="noopener noreferrer" className="hover:text-stone-700 transition-colors">GitHub</a>
            <a href="https://ko-fi.com/zulqurnainjj" target="_blank" rel="noopener noreferrer" className="hover:text-stone-700 transition-colors">Ko-fi</a>
            <a href="/llms.txt" className="hover:text-stone-700 transition-colors">llms.txt</a>
          </nav>
        </div>
        <div className="max-w-5xl mx-auto mt-5 pt-5 border-t border-stone-100 text-center text-xs text-stone-400">
          © {new Date().getFullYear()} Nayab · Built by{" "}
          <a href="https://zulqurnainj.com" className="hover:text-stone-700">Zulqurnain Haider</a>
          {" "}· Runtime:{" "}
          <a href="https://github.com/Zulqurnain/offllama" className="hover:text-stone-700">llmizeOFF</a>
        </div>
      </footer>
    </div>
  );
}
