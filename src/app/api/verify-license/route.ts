/**
 * Layer 2: License verification with Zod validation and standardised errors.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Errors } from "@/lib/errors";
import { logRequest } from "@/lib/logger";

export const runtime = "nodejs";

const GUMROAD_PRODUCT_ID = process.env.GUMROAD_PRODUCT_ID ?? "";

const VerifySchema = z.object({
  licenseKey: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  let statusCode = 200;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      statusCode = 400;
      return Errors.badRequest("Invalid JSON");
    }

    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      statusCode = 400;
      return Errors.badRequest("License key required (min 8 characters)");
    }

    const { licenseKey } = parsed.data;

    if (!GUMROAD_PRODUCT_ID) {
      statusCode = 503;
      return Errors.serviceUnavailable("License verification not configured");
    }

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
      statusCode = 200;
      return NextResponse.json({
        valid: true,
        email: data.purchase?.email ?? "",
        createdAt: data.purchase?.created_at ?? "",
      });
    } else {
      statusCode = 200;
      return NextResponse.json({
        valid: false,
        error: { code: "INVALID_LICENSE", message: data.message ?? "Invalid license" },
      });
    }
  } catch (err) {
    statusCode = 500;
    return Errors.internal("Verification failed. Try again.");
  } finally {
    logRequest({
      method: "POST",
      path: "/api/verify-license",
      statusCode,
      latencyMs: Date.now() - start,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown",
    });
  }
}
