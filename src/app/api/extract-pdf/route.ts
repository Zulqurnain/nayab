import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_SIZE = 1_048_576; // 1 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 1 MB limit" }, { status: 413 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files accepted" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse to avoid Next.js edge runtime issues
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);

    // Ephemeral — nothing stored
    const text = data.text.slice(0, 8000); // cap to 8k chars

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[extract-pdf]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
