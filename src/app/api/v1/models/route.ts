/**
 * Layer 10: /api/v1/models — model list with stale-while-revalidate caching
 */
import { NextResponse } from "next/server";
import { MODELS } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { models: MODELS, updatedAt: new Date().toISOString() },
    {
      headers: {
        // Cache for 5 minutes, serve stale for up to 1 hour while revalidating
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
