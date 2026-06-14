/**
 * Free token quotas for Nayab (PocketBase backend).
 *
 *   Anonymous (not signed in): 20,000 free tokens per 8-hour window (by IP)
 *   Signed-up free users:     200,000 free tokens per 8-hour window (by user id)
 *   Paid users:               unlimited
 */
import { getUsedTokensInWindow } from "./db";

export const ANON_TOKEN_LIMIT = 20_000;
export const FREE_USER_TOKEN_LIMIT = 200_000;
export const WINDOW_MS = 8 * 60 * 60 * 1000;

export function windowStart(now = Date.now()): number {
  return Math.floor(now / WINDOW_MS) * WINDOW_MS;
}
export function windowReset(now = Date.now()): number {
  return windowStart(now) + WINDOW_MS;
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export async function getUsedTokens(opts: { userId?: string | null; ip: string }): Promise<number> {
  try {
    return await getUsedTokensInWindow({
      userId: opts.userId ?? null,
      ip: opts.ip,
      since: windowStart(),
    });
  } catch {
    return 0;
  }
}

export interface QuotaStatus {
  allowed: boolean;
  used: number;
  limit: number;
  resetAt: number;
  signedIn: boolean;
}

export async function checkTokenQuota(opts: {
  userId?: string | null;
  ip: string;
  plan: "free" | "paid";
  tokensNeeded?: number;
}): Promise<QuotaStatus> {
  if (opts.plan === "paid") {
    return { allowed: true, used: 0, limit: Infinity, resetAt: windowReset(), signedIn: true };
  }

  const limit = opts.userId ? FREE_USER_TOKEN_LIMIT : ANON_TOKEN_LIMIT;
  const used = await getUsedTokens({ userId: opts.userId, ip: opts.ip });
  const needed = opts.tokensNeeded ?? 0;
  const allowed = used + needed <= limit;

  return { allowed, used, limit, resetAt: windowReset(), signedIn: !!opts.userId };
}
