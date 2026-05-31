import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID ?? "";

export async function POST(req: NextRequest) {
  let body: { licenseKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request" }, { status: 400 });
  }

  const { licenseKey } = body;
  if (!licenseKey || typeof licenseKey !== "string" || licenseKey.trim().length < 8) {
    return NextResponse.json({ valid: false, error: "License key required" }, { status: 400 });
  }

  if (!GUMROAD_PRODUCT_ID) {
    return NextResponse.json({ valid: false, error: "License verification not configured" }, { status: 503 });
  }

  try {
    const form = new URLSearchParams({
      product_id: GUMROAD_PRODUCT_ID,
      license_key: licenseKey.trim(),
    });

    const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();

    if (data.success) {
      return NextResponse.json({
        valid: true,
        email: data.purchase?.email ?? "",
        createdAt: data.purchase?.created_at ?? "",
      });
    } else {
      return NextResponse.json({ valid: false, error: data.message ?? "Invalid license" });
    }
  } catch (err) {
    console.error("[verify-license]", err instanceof Error ? err.message : err);
    return NextResponse.json({ valid: false, error: "Verification failed. Try again." }, { status: 500 });
  }
}
