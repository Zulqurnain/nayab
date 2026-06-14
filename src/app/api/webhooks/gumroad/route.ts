/**
 * Layer 2, 3, 4: Gumroad webhook — automatically upgrades user plan on purchase.
 * Gumroad POSTs here on every sale. No auth needed on their end (we verify the ping).
 *
 * Setup: In Gumroad dashboard → Settings → Advanced → Ping URL → set to
 * https://chat.zulqurnainj.com/api/webhooks/gumroad
 */
import { NextRequest, NextResponse } from "next/server";
import { logRequest } from "@/lib/logger";
import { getUserByEmail, updateUserPlan } from "@/lib/db";

export const runtime = "nodejs";

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
      const text = await req.text();
      try { data = Object.fromEntries(new URLSearchParams(text)); }
      catch { data = {}; }
    }

    const email = data.email ?? data.buyer_email ?? "";
    const productPermalink = data.product_permalink ?? "";
    const refunded = data.refunded === "true";

    if (productPermalink && !productPermalink.toLowerCase().includes("nayab")) {
      return NextResponse.json({ ok: true, skipped: "different product" });
    }

    if (!email) {
      statusCode = 400;
      return NextResponse.json({ ok: false, error: "No email in ping" });
    }

    try {
      const user = await getUserByEmail(email.toLowerCase().trim());
      if (user) {
        const newPlan = refunded ? "free" : "paid";
        await updateUserPlan(user.id, newPlan);
        logRequest({
          method: "POST",
          path: "/api/webhooks/gumroad",
          statusCode: 200,
          latencyMs: Date.now() - start,
          ip,
          userId: user.id,
        });
      }
    } catch { /* return 200 so Gumroad doesn't retry */ }

    return NextResponse.json({ ok: true, email: email.slice(0, 3) + "***" });
  } catch {
    statusCode = 500;
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "nayab-gumroad-webhook" });
}
