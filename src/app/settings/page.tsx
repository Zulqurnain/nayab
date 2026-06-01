/**
 * Layer 1 & 4: Settings page — protected route.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";

export const metadata = {
  title: "Settings — Nayab",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const user = session.user as { email?: string; plan?: string };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Nav />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">Settings</h1>

        {/* Account */}
        <section className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-stone-900 mb-4">Account</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-stone-100">
              <span className="text-stone-500">Email</span>
              <span className="text-stone-900 font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-stone-100">
              <span className="text-stone-500">Plan</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                user.plan === "paid" ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"
              }`}>
                {user.plan === "paid" ? "Pro" : "Free"}
              </span>
            </div>
          </div>
        </section>

        {/* Sign out */}
        <section className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="font-semibold text-stone-900 mb-4">Session</h2>
          <p className="text-stone-500 text-sm mb-4">
            Sign out of your account on this device.
          </p>
          <SignOutButton />
        </section>
      </main>
    </div>
  );
}

function SignOutButton() {
  // This component is rendered server-side; sign-out is a client-side action
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className="text-sm bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
      >
        Sign out
      </button>
    </form>
  );
}
