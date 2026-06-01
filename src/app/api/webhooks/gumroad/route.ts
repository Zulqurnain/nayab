/**
 * Layer 2, 3, 4: Gumroad webhook — automatically upgrades user plan on purchase.
 * Gumroad POSTs here on every sale. No auth needed on their end (we verify the ping).
 *
 * Setup: In Gumroad dashboard → Settings → Advanced → Ping URL → set to
 * https://chat.zulqurnainj.com/api/webhooks/gumroad
 */
import { NextRequest, NextResponse } from "next/server";
import { logRequest } from "@/lib/logger";
import { getDb, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

// Gumroad pings our endpoint with form-encoded data
export async function POST(req: NextRequest) {
  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  let statusCode = 200;

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let data: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      data = Object.fromEntries(new URLSearchParams(text));
    } else if (contentType.includes("application/json")) {
      data = await req.json() as Record<string, string>;
    } else {
      // Try form-encoded as fallback
      const text = await req.text();
      try { data = Object.fromEntries(new URLSearchParams(text)); }
      catch { data = {}; }
    }

    const email = data.email ?? data.buyer_email ?? "";
    const licenseKey = data.license_key ?? "";
    const productPermalink = data.product_permalink ?? "";
    const refunded = data.refunded === "true";

    // Only process sales for our product
    // Accept if permalink contains "nayab" or if no product filter
    if (productPermalink && !productPermalink.toLowerCase().includes("nayab")) {
      return NextResponse.json({ ok: true, skipped: "different product" });
    }

    if (!email) {
      statusCode = 400;
      return NextResponse.json({ ok: false, error: "No email in ping" });
    }

    try {
      const db = getDb();
      const matchingUsers = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).all();

      if (matchingUsers.length > 0) {
        const newPlan = refunded ? "free" : "paid";
        db.update(users)
          .set({ plan: newPlan, lastActiveAt: new Date() })
          .where(eq(users.email, email.toLowerCase().trim()))
          .run();

        logRequest({
          method: "POST",
          path: "/api/webhooks/gumroad",
          statusCode: 200,
          latencyMs: Date.now() - start,
          ip,
          userId: matchingUsers[0]?.id,
        });
      }
      // Even if user not found: return 200 so Gumroad doesn't retry
    } catch (dbErr) {
      // Log but return 200 — Gumroad will retry on non-200
    }

    return NextResponse.json({ ok: true, email: email.slice(0, 3) + "***" });

  } catch (err) {
    statusCode = 500;
    return NextResponse.json({ ok: false }, { status: 200 }); // Return 200 to prevent Gumroad retries
  }
}

// Gumroad sends GET to verify the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true, service: "nayab-gumroad-webhook" });
}
