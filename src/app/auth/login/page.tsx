"use client";
/**
 * Layer 4: Login page
 */
import { Suspense } from "react";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SparklesIcon } from "@/components/icons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-shadow"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-shadow"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#fafaf9]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-12 rounded-2xl bg-orange-500 flex items-center justify-center mb-3 shadow-lg shadow-orange-200">
            <SparklesIcon className="size-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Sign in to Nayab</h1>
          <p className="text-stone-500 text-sm mt-1">Welcome back!</p>
        </div>

        <Suspense fallback={
          <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center text-stone-400 text-sm">
            Loading…
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-stone-500 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-orange-500 hover:underline font-medium">
            Sign up
          </Link>
        </p>

        <p className="text-center text-sm text-stone-400 mt-2">
          <Link href="/" className="hover:text-orange-500">
            Continue without account →
          </Link>
        </p>
      </div>
    </div>
  );
}
