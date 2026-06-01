"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { SparklesIcon } from "./icons";
import { useState } from "react";

export function Nav() {
  const path = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = session?.user as { email?: string; plan?: string } | undefined;
  const isPro = user?.plan === "paid";

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="size-8 rounded-xl bg-orange-500 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
            <SparklesIcon className="size-4 text-white" />
          </div>
          <span className="font-bold text-stone-900">Nayab</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink href="/" active={path === "/"}>Chat</NavLink>
          <NavLink href="/about" active={path === "/about"}>About</NavLink>
          <NavLink href="/pricing" active={path === "/pricing"}>Pricing</NavLink>
          {user && <NavLink href="/dashboard" active={path === "/dashboard"}>Dashboard</NavLink>}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <div className="size-7 rounded-full bg-stone-100 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
              >
                <div className="size-8 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase() ?? "U"}
                  </span>
                </div>
                {isPro && (
                  <span className="hidden sm:inline bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
                <svg className="size-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-stone-200 rounded-2xl shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-xs text-stone-400 truncate">{user.email}</p>
                      <p className={`text-xs font-semibold mt-0.5 ${isPro ? "text-orange-600" : "text-stone-500"}`}>
                        {isPro ? "Pro Plan" : "Free Plan"}
                      </p>
                    </div>
                    <div className="py-1">
                      <MenuItem href="/" onClick={() => setMenuOpen(false)}>Chat</MenuItem>
                      <MenuItem href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MenuItem>
                      <MenuItem href="/settings" onClick={() => setMenuOpen(false)}>Settings</MenuItem>
                      {!isPro && (
                        <MenuItem href="/pricing" onClick={() => setMenuOpen(false)} highlight>
                          Upgrade to Pro
                        </MenuItem>
                      )}
                    </div>
                    <div className="border-t border-stone-100 py-1">
                      <button
                        onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/"
                className="text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
              >
                Try free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
      active ? "text-orange-600 bg-orange-50" : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
    }`}>
      {children}
    </Link>
  );
}

function MenuItem({ href, onClick, children, highlight }: {
  href: string; onClick: () => void; children: React.ReactNode; highlight?: boolean;
}) {
  return (
    <Link href={href} onClick={onClick}
      className={`block px-4 py-2.5 text-sm transition-colors ${
        highlight
          ? "text-orange-600 font-semibold hover:bg-orange-50"
          : "text-stone-700 hover:bg-stone-50"
      }`}>
      {children}
    </Link>
  );
}
