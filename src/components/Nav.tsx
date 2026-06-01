"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SparklesIcon } from "./icons";

export function Nav() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-8 rounded-xl bg-orange-500 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
            <SparklesIcon className="size-4 text-white" />
          </div>
          <span className="font-bold text-stone-900 text-sm">Nayab</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <NavLink href="/chat" active={path.startsWith("/chat")}>Chat</NavLink>
          <NavLink href="/pricing" active={path === "/pricing"}>Pricing</NavLink>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="text-sm text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors font-medium"
          >
            Sign in
          </Link>
          <Link
            href="/chat"
            className="text-sm bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-sm"
          >
            Try free
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
        active
          ? "text-orange-600 bg-orange-50"
          : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
      }`}
    >
      {children}
    </Link>
  );
}
