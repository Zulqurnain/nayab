/**
 * Free token quotas for Nayab (the llmizeOFF demo).
 *
 *   Anonymous (not signed in): 20,000 free tokens per 8-hour window  (by IP)
 *   Signed-up free users:     200,000 free tokens per 8-hour window  (by user id)
 *   Paid users:               unlimited
 *
 * The window is fixed and aligned to 8-hour boundaries, so a user's allowance
 * resets cleanly every 8 hours. Tokens are estimated at ~4 chars/token across
 * prompt + completion and summed from usage_logs (server-authoritative).
 */
import { getDb, usageLogs } from "./db";
import { and, eq, isNull, sql, gte } from "drizzle-orm";

export const ANON_TOKEN_LIMIT = 20_000;
export const FREE_USER_TOKEN_LIMIT = 200_000;
export const WINDOW_MS = 8 * 60 * 60 * 1000; // 8 hours

/** Start of the current fixed 8-hour window (epoch ms). */
export function windowStart(now = Date.now()): number {
  return Math.floor(now / WINDOW_MS) * WINDOW_MS;
}
/** When the current window resets (epoch ms). */
export function windowReset(now = Date.now()): number {
  return windowStart(now) + WINDOW_MS;
}

/** Rough token estimate: ~4 chars per token. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/** Tokens consumed by this identity within the current 8-hour window. */
export function getUsedTokens(opts: { userId?: number | null; ip: string }): number {
  try {
    const db = getDb();
    const since = new Date(windowStart());
    if (opts.userId) {
      const row = db
        .select({ total: sql<number>`COALESCE(SUM(${usageLogs.tokens}), 0)` })
        .from(usageLogs)
        .where(and(eq(usageLogs.userId, opts.userId), gte(usageLogs.createdAt, since)))
        .get();
      return Number(row?.total ?? 0);
    }
    const row = db
      .select({ total: sql<number>`COALESCE(SUM(${usageLogs.tokens}), 0)` })
      .from(usageLogs)
      .where(and(isNull(usageLogs.userId), eq(usageLogs.ip, opts.ip), gte(usageLogs.createdAt, since)))
      .get();
    return Number(row?.total ?? 0);
  } catch {
    return 0;
  }
}

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  signedIn: boolean;
  plan: string;
  resetAt: number; // epoch ms when the window resets
}

/** Check whether this identity still has free tokens left in the current window. */
export function checkTokenQuota(opts: {
  userId?: number | null;
  ip: string;
  plan?: string;
}): QuotaStatus {
  const signedIn = !!opts.userId;
  const plan = opts.plan ?? "free";
  const resetAt = windowReset();

  // Paid plan = unlimited
  if (plan === "paid") {
    return { allowed: true, used: 0, limit: Infinity, remaining: Infinity, signedIn, plan, resetAt };
  }

  const limit = signedIn ? FREE_USER_TOKEN_LIMIT : ANON_TOKEN_LIMIT;
  const used = getUsedTokens({ userId: opts.userId, ip: opts.ip });
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    signedIn,
    plan,
    resetAt,
  };
}
