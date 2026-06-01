/**
 * Layer 5: /api/health — direct health check (not proxied)
 */
import { NextResponse } from "next/server";
import { checkDb } from "@/lib/db";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function checkLlmizeOff() {
  const url = process.env.LLMIZEOFF_URL ?? process.env.OFFLLAMA_URL ?? "http://127.0.0.1:8080";
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3_000) });
    const latencyMs = Date.now() - start;
    if (res.ok) return { status: "ok" as const, latencyMs };
    return { status: "degraded" as const, latencyMs, detail: `HTTP ${res.status}` };
  } catch (err) {
    return {
      status: "down" as const,
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "unreachable",
    };
  }
}

function checkDisk() {
  try {
    const out = execSync("df -k /var/data 2>/dev/null | awk 'NR==2{print $5}'", { timeout: 2000 })
      .toString().trim().replace("%", "");
    const usedPct = parseInt(out, 10);
    if (isNaN(usedPct)) return { status: "ok" as const };
    if (usedPct > 95) return { status: "degraded" as const, detail: `${usedPct}% used` };
    return { status: "ok" as const, detail: `${usedPct}% used` };
  } catch {
    return { status: "ok" as const, detail: "check skipped" };
  }
}

function checkDbSubsystem() {
  const start = Date.now();
  try {
    const ok = checkDb();
    return ok
      ? { status: "ok" as const, latencyMs: Date.now() - start }
      : { status: "down" as const, detail: "query failed" };
  } catch (err) {
    return { status: "down" as const, detail: err instanceof Error ? err.message : "error" };
  }
}

export async function GET() {
  const [llmizeoffStatus, diskStatus] = await Promise.all([
    checkLlmizeOff(),
    Promise.resolve(checkDisk()),
  ]);
  const dbStatus = checkDbSubsystem();

  const subsystems = { db: dbStatus, llmizeoff: llmizeoffStatus, disk: diskStatus };
  const statuses = Object.values(subsystems).map((s) => s.status);
  const overallStatus = statuses.includes("down") ? "down"
    : statuses.includes("degraded") ? "degraded" : "ok";

  return NextResponse.json(
    { status: overallStatus, subsystems, ts: new Date().toISOString(), version: process.env.npm_package_version ?? "1.0.0" },
    { status: overallStatus === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } }
  );
}
