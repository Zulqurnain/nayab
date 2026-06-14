/**
 * Layer 5 & 13: /api/v1/health — subsystem checks
 * Returns { status: ok|degraded|down, subsystems: {db, llmizeoff, disk} }
 */
import { NextResponse } from "next/server";
import { checkDb } from "@/lib/db";
import { execSync } from "child_process";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SubsystemStatus {
  status: "ok" | "degraded" | "down";
  latencyMs?: number;
  detail?: string;
}

async function checkLlmizeOff(): Promise<SubsystemStatus> {
  const url = process.env.LLMIZEOFF_URL ?? process.env.OFFLLAMA_URL ?? "http://127.0.0.1:8080";
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(3_000),
    });
    const latencyMs = Date.now() - start;
    if (res.ok) return { status: "ok", latencyMs };
    return { status: "degraded", latencyMs, detail: `HTTP ${res.status}` };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "unreachable",
    };
  }
}

function checkDisk(): SubsystemStatus {
  try {
    const out = execSync("df -k /var/data 2>/dev/null | awk 'NR==2{print $5}'", { timeout: 2000 })
      .toString()
      .trim()
      .replace("%", "");
    const usedPct = parseInt(out, 10);
    if (isNaN(usedPct)) return { status: "ok" };
    if (usedPct > 95) return { status: "degraded", detail: `${usedPct}% used` };
    return { status: "ok", detail: `${usedPct}% used` };
  } catch {
    return { status: "ok", detail: "check skipped" };
  }
}

async function checkDbSubsystem(): Promise<SubsystemStatus> {
  const start = Date.now();
  try {
    const ok = await checkDb();
    return ok
      ? { status: "ok", latencyMs: Date.now() - start }
      : { status: "down", detail: "query failed" };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      detail: err instanceof Error ? err.message : "error",
    };
  }
}

export async function GET() {
  const [llmizeoffStatus, diskStatus] = await Promise.all([
    checkLlmizeOff(),
    Promise.resolve(checkDisk()),
  ]);
  const dbStatus = await checkDbSubsystem();

  const subsystems = {
    db: dbStatus,
    llmizeoff: llmizeoffStatus,
    disk: diskStatus,
  };

  const statuses = Object.values(subsystems).map((s) => s.status);
  const overallStatus = statuses.includes("down")
    ? "down"
    : statuses.includes("degraded")
    ? "degraded"
    : "ok";

  return NextResponse.json(
    {
      status: overallStatus,
      subsystems,
      ts: new Date().toISOString(),
      version: process.env.npm_package_version ?? "1.0.0",
    },
    {
      status: overallStatus === "down" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
