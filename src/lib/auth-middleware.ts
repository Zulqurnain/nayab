/**
 * Layer 8: Route-level RLS checks.
 * Provides helpers for API routes to enforce auth and plan requirements.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { NextRequest, NextResponse } from "next/server";

export type Plan = "free" | "paid";

export interface SessionUser {
  id: string;
  email: string;
  plan: Plan;
}

/** Get authenticated session user, or null */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  // next-auth getServerSession works with App Router when passed req headers
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    return session.user as SessionUser;
  } catch {
    return null;
  }
}

/** Require auth — returns 401 response if not authenticated */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }
  return { user };
}

/** Require paid plan — returns 402 response if on free plan */
export async function requirePaid(
  req: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  const { user } = result;
  if (user.plan !== "paid") {
    return NextResponse.json(
      { error: { code: "PAYMENT_REQUIRED", message: "Paid plan required" } },
      { status: 402 }
    );
  }
  return { user };
}

/** Standard CORS headers for API routes */
export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowed = process.env.ALLOWED_ORIGINS?.split(",") ?? ["https://chat.zulqurnainj.com"];
  const o = origin ?? "*";
  const isAllowed = allowed.includes(o) || allowed.includes("*");
  return {
    "Access-Control-Allow-Origin": isAllowed ? o : allowed[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-license-key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/** Handle OPTIONS preflight */
export function handleOptions(req: NextRequest): NextResponse {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
