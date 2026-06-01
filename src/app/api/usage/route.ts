/**
 * GET /api/usage — current token quota status for the caller.
 * Used by the chat UI to display remaining free tokens and the reset time.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-middleware";
import { checkTokenQuota } from "@/lib/token-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  let sessionUser: Awaited<ReturnType<typeof getSessionUser>> = null;
  try {
    sessionUser = await getSessionUser(req);
  } catch { /* anonymous */ }

  const hasLicense = !!req.headers.get("x-license-key");
  const plan = sessionUser?.plan === "paid" || hasLicense ? "paid" : "free";

  const q = checkTokenQuota({ userId: sessionUser?.id ?? null, ip, plan });

  return NextResponse.json(
    {
      signedIn: q.signedIn,
      plan: q.plan,
      used: q.used,
      limit: q.limit === Infinity ? null : q.limit,
      remaining: q.remaining === Infinity ? null : q.remaining,
      resetAt: q.resetAt,
      unlimited: q.limit === Infinity,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
