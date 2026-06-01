import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import Link from "next/link";
import { getDb, usageLogs, users } from "@/lib/db";
import { eq, gte, count, sql } from "drizzle-orm";

export const metadata = { title: "Dashboard — Nayab" };

async function getUserStats(userId: number) {
  try {
    const db = getDb();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [todayRows, weekRows, totalRows] = await Promise.all([
      db.select({ n: count() }).from(usageLogs)
        .where(eq(usageLogs.userId, userId))
        .all(),
      db.select({ n: count() }).from(usageLogs)
        .where(eq(usageLogs.userId, userId))
        .all(),
      db.select({ n: count() }).from(usageLogs)
        .where(eq(usageLogs.userId, userId))
        .all(),
    ]);

    // Simpler individual queries
    const todayCount = db.select({ n: count() }).from(usageLogs)
      .where(sql`${usageLogs.userId} = ${userId} AND ${usageLogs.createdAt} >= ${todayStart.getTime()}`)
      .get()?.n ?? 0;

    const weekCount = db.select({ n: count() }).from(usageLogs)
      .where(sql`${usageLogs.userId} = ${userId} AND ${usageLogs.createdAt} >= ${weekStart.getTime()}`)
      .get()?.n ?? 0;

    const totalCount = db.select({ n: count() }).from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .get()?.n ?? 0;

    // DB plan (fresher than JWT)
    const dbUser = db.select({ plan: users.plan, createdAt: users.createdAt })
      .from(users).where(eq(users.id, userId)).get();

    return { todayCount, weekCount, totalCount, dbPlan: dbUser?.plan, memberSince: dbUser?.createdAt };
  } catch {
    return { todayCount: 0, weekCount: 0, totalCount: 0, dbPlan: null, memberSince: null };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const sessionUser = session.user as { id?: string; email?: string; plan?: string };
  const userId = sessionUser.id ? parseInt(sessionUser.id) : 0;
  const stats = await getUserStats(userId);

  // Use DB plan as source of truth (JWT may lag after upgrade)
  const plan = stats.dbPlan ?? sessionUser.plan ?? "free";
  const isPro = plan === "paid";

  const memberSince = stats.memberSince
    ? new Date(stats.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {/* Header */}
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

        {/* Stats row */}
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

        {/* Plan card */}
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
              <div className="text-3xl text-orange-400">
                <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
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
              <Link href="/chat" className="text-orange-500 hover:underline">Open chat and click the Upgrade button</Link>
              {" "}to activate with your license key.
              {plan !== sessionUser.plan && (
                <span className="ml-1 text-green-600">✓ Plan updated — sign out and back in to refresh your session.</span>
              )}
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link href="/chat" className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-5 transition-colors flex items-center gap-3 group">
            <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <div>
              <h3 className="font-semibold">Open Chat</h3>
              <p className="text-orange-100 text-xs mt-0.5">Start a new conversation</p>
            </div>
          </Link>
          <Link href="/settings" className="bg-white border border-stone-200 hover:border-orange-300 rounded-2xl p-5 transition-colors flex items-center gap-3 group">
            <svg className="size-5 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-stone-900 group-hover:text-orange-600">Settings</h3>
              <p className="text-stone-500 text-xs mt-0.5">Account & preferences</p>
            </div>
          </Link>
          <Link href="/pricing" className="bg-white border border-stone-200 hover:border-orange-300 rounded-2xl p-5 transition-colors flex items-center gap-3 group">
            <svg className="size-5 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
            <div>
              <h3 className="font-semibold text-stone-900 group-hover:text-orange-600">Pricing</h3>
              <p className="text-stone-500 text-xs mt-0.5">View plans & features</p>
            </div>
          </Link>
        </div>

        {/* Account info */}
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
