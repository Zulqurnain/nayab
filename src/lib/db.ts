/**
 * Nayab PocketBase data layer — replaces Drizzle ORM + better-sqlite3.
 * All functions are async (HTTP to local PocketBase at 127.0.0.1:8090).
 */

const PB = process.env.POCKETBASE_URL ?? "http://127.0.0.1:8090";
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL ?? "zulqurnainapps@gmail.com";
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? "";

// ─── Admin token cache ──────────────────────────────────────────────────────

let _cachedToken: string | null = null;
let _tokenExpiry = 0;

async function adminToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) return _cachedToken;

  const r = await fetch(
    `${PB}/api/collections/_superusers/auth-with-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password: PB_ADMIN_PASSWORD }),
    }
  );
  if (!r.ok) throw new Error(`PB auth failed: ${r.status}`);
  const d = await r.json() as { token: string };
  _cachedToken = d.token;
  _tokenExpiry = now + 10 * 60 * 1000; // refresh every 10 min
  return _cachedToken;
}

async function pbFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = await adminToken();
  return fetch(`${PB}${path}`, {
    ...opts,
    headers: { "Authorization": token, "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface NyUser {
  id: string;
  email: string;
  passwordHash: string;
  plan: "free" | "paid";
  createdAt: number;
  lastActiveAt: number;
}

export interface NyApiKey {
  id: string;
  userId: string;
  keyHash: string;
  name: string;
  revokedAt: number | null;
  created: string;
}

export interface NyUsageLog {
  id: string;
  userId: string | null;
  ip: string;
  model: string;
  tokens: number;
  latencyMs: number;
  created: string;
}

export interface NyRateBucket {
  id: string;
  key: string;
  tokens: number;
  lastRefill: number;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<NyUser | null> {
  const r = await pbFetch(
    `/api/collections/ny_users/records?filter=${encodeURIComponent(`email="${email.toLowerCase()}"`)}&perPage=1`
  );
  if (!r.ok) return null;
  const d = await r.json() as { items: Record<string, unknown>[] };
  if (!d.items?.length) return null;
  return mapUser(d.items[0]);
}

export async function getUserById(id: string): Promise<NyUser | null> {
  const r = await pbFetch(`/api/collections/ny_users/records/${id}`);
  if (!r.ok) return null;
  return mapUser(await r.json());
}

export async function createUser(data: { email: string; passwordHash: string; plan?: "free" | "paid" }): Promise<NyUser> {
  const now = Date.now();
  const r = await pbFetch("/api/collections/ny_users/records", {
    method: "POST",
    body: JSON.stringify({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      plan: data.plan ?? "free",
      createdAt: now,
      lastActiveAt: now,
    }),
  });
  if (!r.ok) throw new Error(`createUser failed: ${await r.text()}`);
  return mapUser(await r.json());
}

export async function updateUserPlan(id: string, plan: "free" | "paid"): Promise<void> {
  await pbFetch(`/api/collections/ny_users/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ plan, lastActiveAt: Date.now() }),
  });
}

export async function touchUser(id: string): Promise<void> {
  await pbFetch(`/api/collections/ny_users/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ lastActiveAt: Date.now() }),
  });
}

function mapUser(r: Record<string, unknown>): NyUser {
  return {
    id: r.id as string,
    email: r.email as string,
    passwordHash: (r.passwordHash ?? "") as string,
    plan: (r.plan as "free" | "paid") ?? "free",
    createdAt: Number(r.createdAt ?? 0),
    lastActiveAt: Number(r.lastActiveAt ?? 0),
  };
}

// ─── Usage logs ─────────────────────────────────────────────────────────────

export async function insertUsageLog(data: {
  userId?: string | null;
  ip: string;
  model: string;
  tokens: number;
  latencyMs: number;
}): Promise<void> {
  await pbFetch("/api/collections/ny_usage_logs/records", {
    method: "POST",
    body: JSON.stringify({
      userId: data.userId ?? "",
      ip: data.ip,
      model: data.model,
      tokens: data.tokens,
      latencyMs: data.latencyMs,
    }),
  });
}

export async function getUsedTokensInWindow(opts: {
  userId?: string | null;
  ip: string;
  since: number;
}): Promise<number> {
  let filter: string;
  if (opts.userId) {
    filter = `userId="${opts.userId}" && created>="${new Date(opts.since).toISOString()}"`;
  } else {
    filter = `userId="" && ip="${opts.ip}" && created>="${new Date(opts.since).toISOString()}"`;
  }
  const r = await pbFetch(
    `/api/collections/ny_usage_logs/records?filter=${encodeURIComponent(filter)}&perPage=500&fields=tokens`
  );
  if (!r.ok) return 0;
  const d = await r.json() as { items: { tokens: number }[] };
  return d.items?.reduce((sum, item) => sum + (item.tokens ?? 0), 0) ?? 0;
}

export async function countLogsByUser(userId: string): Promise<{ today: number; week: number; total: number }> {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [todayR, weekR, totalR] = await Promise.all([
    pbFetch(`/api/collections/ny_usage_logs/records?filter=${encodeURIComponent(`userId="${userId}" && created>="${todayStart.toISOString()}"`)}&perPage=1`),
    pbFetch(`/api/collections/ny_usage_logs/records?filter=${encodeURIComponent(`userId="${userId}" && created>="${weekStart.toISOString()}"`)}&perPage=1`),
    pbFetch(`/api/collections/ny_usage_logs/records?filter=${encodeURIComponent(`userId="${userId}"`)}&perPage=1`),
  ]);

  const parse = async (res: Response) => {
    if (!res.ok) return 0;
    const d = await res.json() as { totalItems?: number };
    return d.totalItems ?? 0;
  };

  const [today, week, total] = await Promise.all([parse(todayR), parse(weekR), parse(totalR)]);
  return { today, week, total };
}

// ─── Rate limit buckets ─────────────────────────────────────────────────────

export async function getRateBucket(key: string): Promise<NyRateBucket | null> {
  const r = await pbFetch(
    `/api/collections/ny_rate_limit_buckets/records?filter=${encodeURIComponent(`key="${key}"`)}&perPage=1`
  );
  if (!r.ok) return null;
  const d = await r.json() as { items: Record<string, unknown>[] };
  if (!d.items?.length) return null;
  return mapBucket(d.items[0]);
}

export async function upsertRateBucket(data: { key: string; tokens: number; lastRefill: number }): Promise<void> {
  const existing = await getRateBucket(data.key);
  if (existing) {
    await pbFetch(`/api/collections/ny_rate_limit_buckets/records/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ tokens: data.tokens, lastRefill: data.lastRefill }),
    });
  } else {
    await pbFetch("/api/collections/ny_rate_limit_buckets/records", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

function mapBucket(r: Record<string, unknown>): NyRateBucket {
  return {
    id: r.id as string,
    key: r.key as string,
    tokens: Number(r.tokens ?? 0),
    lastRefill: Number(r.lastRefill ?? 0),
  };
}

// ─── Health check ────────────────────────────────────────────────────────────

export async function checkDb(): Promise<boolean> {
  try {
    const r = await fetch(`${PB}/api/health`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}
