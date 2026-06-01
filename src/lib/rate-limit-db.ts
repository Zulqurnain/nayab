/**
 * Layer 9: DB-backed rate limiting using token bucket algorithm.
 * - Free / anonymous: refill 1 token/5s, max burst 3
 * - Paid users: refill 1 token/5s, max burst 10
 * Falls back to in-memory if DB is unavailable.
 */
import { getDb, rateLimitBuckets } from "./db";
import { eq } from "drizzle-orm";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

const REFILL_RATE_MS = 5_000; // 1 token per 5 seconds
const FREE_BURST = 3;
const PAID_BURST = 10;

// In-memory fallback (same as before)
const memStore = new Map<string, { tokens: number; lastRefill: number }>();

function memCheck(key: string, burst: number): RateLimitResult {
  const now = Date.now();
  let entry = memStore.get(key);
  if (!entry) {
    entry = { tokens: burst, lastRefill: now };
    memStore.set(key, entry);
  }
  const elapsed = now - entry.lastRefill;
  const refilled = Math.floor(elapsed / REFILL_RATE_MS);
  if (refilled > 0) {
    entry.tokens = Math.min(burst, entry.tokens + refilled);
    entry.lastRefill = now - (elapsed % REFILL_RATE_MS);
  }
  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    return { allowed: true, retryAfterMs: 0 };
  }
  const retryAfterMs = REFILL_RATE_MS - (now - entry.lastRefill);
  return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
}

export function checkRateLimitDb(
  key: string,
  plan: "free" | "paid" = "free"
): RateLimitResult {
  const burst = plan === "paid" ? PAID_BURST : FREE_BURST;
  const now = Date.now();

  try {
    const db = getDb();
    const existing = db
      .select()
      .from(rateLimitBuckets)
      .where(eq(rateLimitBuckets.key, key))
      .all();

    if (existing.length === 0) {
      // New bucket — start with burst-1 (consumed one token)
      db.insert(rateLimitBuckets)
        .values({ key, tokens: burst - 1, lastRefill: new Date(now) })
        .run();
      return { allowed: true, retryAfterMs: 0 };
    }

    const row = existing[0];
    const lastRefill = row.lastRefill instanceof Date
      ? row.lastRefill.getTime()
      : Number(row.lastRefill);
    const elapsed = now - lastRefill;
    const refilled = Math.floor(elapsed / REFILL_RATE_MS);
    let tokens = Math.min(burst, row.tokens + refilled);
    const newLastRefill = refilled > 0
      ? new Date(lastRefill + refilled * REFILL_RATE_MS)
      : row.lastRefill;

    if (tokens >= 1) {
      tokens -= 1;
      db.update(rateLimitBuckets)
        .set({ tokens, lastRefill: newLastRefill })
        .where(eq(rateLimitBuckets.key, key))
        .run();
      return { allowed: true, retryAfterMs: 0 };
    }

    const retryAfterMs = REFILL_RATE_MS - (elapsed % REFILL_RATE_MS);
    return { allowed: false, retryAfterMs };
  } catch {
    // DB unavailable — fall back to in-memory
    return memCheck(key, burst);
  }
}
