/**
 * Layer 2 & 9: Search API with Zod validation, standardised errors, DB-backed rate limiting.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimitDb } from "@/lib/rate-limit-db";
import { Errors } from "@/lib/errors";
import { logRequest } from "@/lib/logger";

export const runtime = "nodejs";

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

const QuerySchema = z.object({
  q: z.string().min(2).max(200),
});

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  const ip = getClientIp(req);
  let statusCode = 200;

  try {
    // Layer 9: Rate limiting
    const rl = await checkRateLimitDb(`search:${ip}`, "free");
    if (!rl.allowed) {
      statusCode = 429;
      return Errors.tooManyRequests("Rate limited", rl.retryAfterMs);
    }

    // Layer 2: Zod validation
    const raw = { q: req.nextUrl.searchParams.get("q") ?? "" };
    const parsed = QuerySchema.safeParse(raw);
    if (!parsed.success) {
      statusCode = 400;
      return Errors.badRequest("Query must be 2–200 characters");
    }

    const query = parsed.data.q.trim();

    // DuckDuckGo Instant Answer API
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl, {
      headers: { "User-Agent": "Nayab/1.0 (chat.zulqurnainj.com)" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) throw new Error(`DDG responded ${res.status}`);
    const data = await res.json();

    const results: SearchResult[] = [];

    if (data.AbstractText) {
      results.push({ title: data.AbstractSource || query, snippet: data.AbstractText, url: data.AbstractURL || "" });
    }
    if (Array.isArray(data.RelatedTopics)) {
      for (const t of data.RelatedTopics) {
        if (results.length >= 5) break;
        if (t.Text && t.FirstURL) results.push({ title: t.Text.slice(0, 80), snippet: t.Text, url: t.FirstURL });
      }
    }
    if (Array.isArray(data.Results)) {
      for (const r of data.Results) {
        if (results.length >= 5) break;
        if (r.Text && r.FirstURL) results.push({ title: r.Text.slice(0, 80), snippet: r.Text, url: r.FirstURL });
      }
    }

    const context = results.length > 0
      ? results.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`).join("\n\n")
      : "No relevant results found.";

    return NextResponse.json({ results, context }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err) {
    statusCode = 200; // search errors are non-fatal
    return NextResponse.json({ results: [], context: "" });
  } finally {
    logRequest({ method: "GET", path: "/api/search", statusCode, latencyMs: Date.now() - start, ip });
  }
}
