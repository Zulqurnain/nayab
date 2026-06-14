/**
 * DB-backed rate limiting using token bucket algorithm (PocketBase backend).
 * Falls back to in-memory if PocketBase is unavailable.
 */
import { getRateBucket, upsertRateBucket } from "./db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

const REFILL_RATE_MS = 5_000;
const FREE_BURST = 3;
const PAID_BURST = 10;

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
  return { allowed: false, retryAfterMs: Math.max(0, REFILL_RATE_MS - (now - entry.lastRefill)) };
}

export async function checkRateLimitDb(
  key: string,
  plan: "free" | "paid" = "free"
): Promise<RateLimitResult> {
  const burst = plan === "paid" ? PAID_BURST : FREE_BURST;
  const now = Date.now();

  try {
    const row = await getRateBucket(key);

    if (!row) {
      await upsertRateBucket({ key, tokens: burst - 1, lastRefill: now });
      return { allowed: true, retryAfterMs: 0 };
    }

    const elapsed = now - row.lastRefill;
    const refilled = Math.floor(elapsed / REFILL_RATE_MS);
    let tokens = Math.min(burst, row.tokens + refilled);
    const newLastRefill = refilled > 0 ? row.lastRefill + refilled * REFILL_RATE_MS : row.lastRefill;

    if (tokens >= 1) {
      tokens -= 1;
      upsertRateBucket({ key, tokens, lastRefill: newLastRefill }).catch(() => {});
      return { allowed: true, retryAfterMs: 0 };
    }

    return { allowed: false, retryAfterMs: REFILL_RATE_MS - (elapsed % REFILL_RATE_MS) };
  } catch {
    return memCheck(key, burst);
  }
}
