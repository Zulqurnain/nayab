import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`search:${ip}`);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const query = q.trim().slice(0, 200);

  try {
    // DuckDuckGo Instant Answer API — free, no key required
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const res = await fetch(ddgUrl, {
      headers: { "User-Agent": "Nayab/1.0 (chat.zulqurnainj.com)" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) throw new Error(`DDG responded ${res.status}`);
    const data = await res.json();

    const results: SearchResult[] = [];

    // AbstractText (main knowledge panel)
    if (data.AbstractText) {
      results.push({
        title: data.AbstractSource || query,
        snippet: data.AbstractText,
        url: data.AbstractURL || "",
      });
    }

    // RelatedTopics
    if (Array.isArray(data.RelatedTopics)) {
      for (const t of data.RelatedTopics) {
        if (results.length >= 5) break;
        if (t.Text && t.FirstURL) {
          results.push({ title: t.Text.slice(0, 80), snippet: t.Text, url: t.FirstURL });
        }
      }
    }

    // Results
    if (Array.isArray(data.Results)) {
      for (const r of data.Results) {
        if (results.length >= 5) break;
        if (r.Text && r.FirstURL) {
          results.push({ title: r.Text.slice(0, 80), snippet: r.Text, url: r.FirstURL });
        }
      }
    }

    // Format as context string for the LLM
    const context = results.length > 0
      ? results.map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`).join("\n\n")
      : "No relevant results found. Please note the answer may not reflect the latest information.";

    return NextResponse.json({ results, context });
  } catch (err) {
    console.error("[search] error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ results: [], context: "" }, { status: 200 });
  }
}
