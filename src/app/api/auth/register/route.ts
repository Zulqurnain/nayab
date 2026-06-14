import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { logRequest } from "@/lib/logger";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(req: NextRequest) {
  const start = Date.now();
  let status = 200;

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      status = 400;
      return Errors.badRequest("Invalid JSON");
    }

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      status = 400;
      return Errors.badRequest("Validation failed", parsed.error.flatten());
    }

    const { email, password } = parsed.data;

    const existing = await getUserByEmail(email.toLowerCase());
    if (existing) {
      status = 409;
      return NextResponse.json(
        { error: { code: "EMAIL_TAKEN", message: "Email already registered" } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await createUser({ email: email.toLowerCase(), passwordHash, plan: "free" });

    status = 201;
    return NextResponse.json({ success: true, message: "Account created" }, { status: 201 });
  } catch {
    status = 500;
    return Errors.internal();
  } finally {
    logRequest({
      method: "POST",
      path: "/api/auth/register",
      statusCode: status,
      latencyMs: Date.now() - start,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown",
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
