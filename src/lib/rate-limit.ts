interface RateEntry {
  lastRequest: number;
  count: number;
  windowStart: number;
}

const store = new Map<string, RateEntry>();
const CLEANUP_INTERVAL = 60_000; // clean old entries every minute

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 60_000) store.delete(key);
  }
}, CLEANUP_INTERVAL);

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

/**
 * Rate limiting: max 20 requests per minute per IP.
 * No per-request cooldown — users can send a new message as soon as the
 * previous response is done. The per-minute cap prevents bulk abuse.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  const WINDOW = 60_000;    // 1-minute window
  const MAX_PER_WINDOW = 20;

  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { lastRequest: now, count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  // Reset window if expired
  if (now - entry.windowStart > WINDOW) {
    entry.windowStart = now;
    entry.count = 0;
  }

  // Check per-minute cap
  if (entry.count >= MAX_PER_WINDOW) {
    const retryAfterMs = WINDOW - (now - entry.windowStart);
    return { allowed: false, retryAfterMs };
  }

  entry.lastRequest = now;
  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
