import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import Link from "next/link";
import { countLogsByUser, getUserByEmail } from "@/lib/db";

export const metadata = { title: "Dashboard — Nayab" };

async function getUserStats(userId: string, email: string) {
  try {
    const [counts, dbUser] = await Promise.all([
      countLogsByUser(userId),
      email ? getUserByEmail(email) : Promise.resolve(null),
    ]);
    return {
      todayCount: counts.today,
      weekCount: counts.week,
      totalCount: counts.total,
      dbPlan: dbUser?.plan ?? null,
      memberSince: dbUser?.createdAt ?? null,
    };
  } catch {
    return { todayCount: 0, weekCount: 0, totalCount: 0, dbPlan: null as string | null, memberSince: null as number | null };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const sessionUser = session.user as { id?: string; email?: string; plan?: string };
  const userId = sessionUser.id ?? "";
  const stats = await getUserStats(userId, sessionUser.email ?? "");

  const plan = stats.dbPlan ?? sessionUser.plan ?? "free";
  const isPro = plan === "paid";

  const memberSince = stats.memberSince
    ? new Date(stats.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
            <p className="text-stone-500 mt-1 text-sm">{sessionUser.email}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
            isPro ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"
          }`}>
            {isPro ? "Pro" : "Free"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Messages today", value: stats.todayCount, limit: isPro ? "~300" : "~20/min" },
            { label: "This week", value: stats.weekCount, limit: null },
            { label: "All time", value: stats.totalCount, limit: null },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-xs text-stone-400 font-medium mb-1.5">{s.label}</p>
              <p className="text-3xl font-bold text-stone-900">{s.value}</p>
              {s.limit && <p className="text-xs text-stone-400 mt-1">limit: {s.limit}</p>}
            </div>
          ))}
        </div>

        {isPro ? (
          <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent pointer-events-none" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">PRO</span>
                  <span className="text-stone-400 text-sm">Active</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Nayab Pro Plan</h2>
                <p className="text-stone-400 text-sm">Full access to GPT-4o, Claude Sonnet, and all premium models.</p>
              </div>
            </div>
            <div className="relative mt-4 pt-4 border-t border-stone-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {["GPT-4o", "GPT-4o Mini", "Claude 3.5 Sonnet", "Claude 3 Haiku"].map((m) => (
                <div key={m} className="flex items-center gap-1.5 text-stone-300">
                  <span className="text-orange-400">✓</span>{m}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-2xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-stone-900 mb-1">Upgrade to Pro</h2>
                <p className="text-stone-500 text-sm">
                  Get GPT-4o, Claude Sonnet, Claude Haiku, and GPT-4o Mini. $10/month.
                </p>
              </div>
              <a
                href="https://zulqurnain45.gumroad.com/l/nayab"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-orange-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors"
              >
                Upgrade on Gumroad →
              </a>
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Already purchased?{" "}
              <Link href="/" className="text-orange-500 hover:underline">Open chat and click the Upgrade button</Link>
              {" "}to activate with your license key.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link href="/" className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-5 transition-colors flex items-center gap-3">
            <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <div>
              <h3 className="font-semibold">Open Chat</h3>
              <p className="text-orange-100 text-xs mt-0.5">Start a new conversation</p>
            </div>
          </Link>
          <Link href="/settings" className="bg-white border border-stone-200 hover:border-orange-300 rounded-2xl p-5 transition-colors flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-stone-900">Settings</h3>
              <p className="text-stone-500 text-xs mt-0.5">Account &amp; preferences</p>
            </div>
          </Link>
          <Link href="/pricing" className="bg-white border border-stone-200 hover:border-orange-300 rounded-2xl p-5 transition-colors flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-stone-900">Pricing</h3>
              <p className="text-stone-500 text-xs mt-0.5">View plans &amp; features</p>
            </div>
          </Link>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="font-semibold text-stone-900 mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-stone-100">
              <span className="text-stone-500">Email</span>
              <span className="text-stone-900 font-medium">{sessionUser.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-stone-100">
              <span className="text-stone-500">Plan</span>
              <span className={`font-semibold ${isPro ? "text-orange-600" : "text-stone-600"}`}>
                {isPro ? "Pro" : "Free"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-stone-500">Member since</span>
              <span className="text-stone-900">{memberSince}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
