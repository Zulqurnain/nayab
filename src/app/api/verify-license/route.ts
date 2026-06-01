/**
 * Layer 2, 3, 4: License verification with Zod validation.
 * On success: upgrades user plan in DB (if authenticated) so dashboard reflects it.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Errors } from "@/lib/errors";
import { logRequest } from "@/lib/logger";
import { getSessionUser } from "@/lib/auth-middleware";
import { getDb, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID ?? "";

const VerifySchema = z.object({
  licenseKey: z.string().min(4).max(256),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  let statusCode = 200;

  try {
    let body: unknown;
    try { body = await req.json(); }
    catch { statusCode = 400; return Errors.badRequest("Invalid JSON"); }

    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      statusCode = 400;
      return Errors.badRequest("License key required");
    }

    const { licenseKey } = parsed.data;

    if (!GUMROAD_PRODUCT_ID) {
      // Fallback: accept any 16+ char key for demo purposes when not configured
      if (licenseKey.length >= 16) {
        statusCode = 200;
        return NextResponse.json({ valid: true, email: "demo@example.com", demo: true });
      }
      statusCode = 503;
      return Errors.serviceUnavailable("License verification not configured. Contact support.");
    }

    // Call Gumroad API
    let data: Record<string, unknown>;
    try {
      const form = new URLSearchParams({
        product_id: GUMROAD_PRODUCT_ID,
        license_key: licenseKey.trim(),
        increment_uses_count: "false",
      });
      const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
        signal: AbortSignal.timeout(12_000),
      });
      data = await res.json() as Record<string, unknown>;
    } catch (err) {
      statusCode = 502;
      return Errors.serviceUnavailable("Could not reach Gumroad. Please try again.");
    }

    if (!data.success) {
      statusCode = 200;
      const msg = typeof data.message === "string" ? data.message : "Invalid or expired license key.";
      return NextResponse.json({ valid: false, message: msg });
    }

    const purchase = data.purchase as Record<string, unknown> | undefined;
    const email = typeof purchase?.email === "string" ? purchase.email : "";

    // Layer 3 & 4: If user is authenticated, upgrade their plan in DB immediately
    let planUpgraded = false;
    try {
      const sessionUser = await getSessionUser(req);
      if (sessionUser) {
        const db = getDb();
        db.update(users)
          .set({ plan: "paid", lastActiveAt: new Date() })
          .where(eq(users.id, sessionUser.id))
          .run();
        planUpgraded = true;
      }
    } catch { /* non-fatal — they still get localStorage-based access */ }

    statusCode = 200;
    return NextResponse.json({
      valid: true,
      email,
      planUpgraded,
      // Tell client to refresh session if we upgraded the DB
      requiresSessionRefresh: planUpgraded,
    });

  } catch (err) {
    statusCode = 500;
    return Errors.internal("Verification failed. Try again.");
  } finally {
    logRequest({ method: "POST", path: "/api/verify-license", statusCode, latencyMs: Date.now() - start, ip });
  }
}
