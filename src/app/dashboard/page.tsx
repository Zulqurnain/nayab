/**
 * Layer 1 & 4: User dashboard — protected route.
 * Middleware redirects to /auth/login if not authenticated.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import Link from "next/link";

export const metadata = {
  title: "Dashboard — Nayab",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const user = session.user as { email?: string; plan?: string };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 mt-1">Welcome back, {user.email}</p>
        </div>

        {/* Plan badge */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-stone-900">Your plan</h2>
              <p className="text-stone-500 text-sm mt-1">
                {user.plan === "paid"
                  ? "You have full access to all premium models."
                  : "Free plan — upgrade to unlock GPT-4o and Claude Sonnet."}
              </p>
            </div>
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                user.plan === "paid"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {user.plan === "paid" ? "Pro" : "Free"}
            </span>
          </div>
          {user.plan !== "paid" && (
            <div className="mt-4">
              <Link
                href="/pricing"
                className="text-sm bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/chat"
            className="bg-white border border-stone-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold text-stone-900 group-hover:text-orange-600">Open Chat</h3>
            <p className="text-stone-500 text-sm mt-1">Start a new conversation with Nayab.</p>
          </Link>

          <Link
            href="/settings"
            className="bg-white border border-stone-200 rounded-2xl p-6 hover:border-orange-300 hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <h3 className="font-semibold text-stone-900 group-hover:text-orange-600">Settings</h3>
            <p className="text-stone-500 text-sm mt-1">Manage your account and preferences.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
