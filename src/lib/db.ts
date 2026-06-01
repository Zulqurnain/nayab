/**
 * Layer 3: Database and Storage
 * Drizzle ORM + better-sqlite3 synchronous driver.
 * Database file lives at /var/data/nayab.db (outside Next.js build).
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import path from "path";
import fs from "fs";

// ─── Schema ────────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plan: text("plan", { enum: ["free", "paid"] }).notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  lastActiveAt: integer("last_active_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const apiKeys = sqliteTable("api_keys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  keyHash: text("key_hash").notNull().unique(),
  name: text("name").notNull().default("default"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
});

export const usageLogs = sqliteTable("usage_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  ip: text("ip").notNull().default("unknown"),
  model: text("model").notNull(),
  tokens: integer("tokens").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const rateLimitBuckets = sqliteTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  tokens: real("tokens").notNull(),
  lastRefill: integer("last_refill", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Singleton connection ───────────────────────────────────────────────────

const DB_PATH = process.env.DB_PATH ?? "/var/data/nayab.db";

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;

export function getDb() {
  if (_db) return _db;

  // Ensure directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _sqlite = new Database(DB_PATH);
  _sqlite.pragma("journal_mode = WAL");
  _sqlite.pragma("foreign_keys = ON");

  _db = drizzle(_sqlite);

  // Run migrations inline (idempotent CREATE IF NOT EXISTS)
  _sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','paid')),
      created_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT 'default',
      created_at INTEGER NOT NULL,
      revoked_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ip TEXT NOT NULL DEFAULT 'unknown',
      model TEXT NOT NULL,
      tokens INTEGER NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      key TEXT PRIMARY KEY,
      tokens REAL NOT NULL,
      last_refill INTEGER NOT NULL
    );
  `);

  return _db;
}

/** Graceful shutdown */
export function closeDb() {
  _sqlite?.close();
  _sqlite = null;
  _db = null;
}

/** Quick connectivity check — returns true if DB is reachable */
export function checkDb(): boolean {
  try {
    const db = getDb();
    db.run(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
