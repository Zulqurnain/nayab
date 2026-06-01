/**
 * Layer 2: PDF extraction with Zod-style validation and standardised errors.
 */
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/lib/errors";
import { logRequest } from "@/lib/logger";

export const runtime = "nodejs";

const MAX_SIZE = 1_048_576; // 1 MB

export async function POST(req: NextRequest) {
  const start = Date.now();
  let statusCode = 200;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      statusCode = 400;
      return Errors.badRequest("No file provided");
    }

    const f = file as File;

    if (f.size > MAX_SIZE) {
      statusCode = 413;
      return Errors.tooLarge("File exceeds 1 MB limit");
    }

    if (f.type !== "application/pdf") {
      statusCode = 400;
      return Errors.badRequest("Only PDF files accepted");
    }

    const arrayBuffer = await f.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);

    const text = data.text.slice(0, 8000); // cap to 8k chars — ephemeral, nothing stored

    return NextResponse.json({ text });
  } catch (err) {
    statusCode = 500;
    return Errors.internal("Failed to parse PDF");
  } finally {
    logRequest({
      method: "POST",
      path: "/api/extract-pdf",
      statusCode,
      latencyMs: Date.now() - start,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown",
    });
  }
}
