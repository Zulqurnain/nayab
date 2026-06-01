/**
 * Layer 12: Error tracking stub.
 * Real Sentry SDK can be added by setting SENTRY_DSN env var.
 * Without it, this module is a no-op so the build stays clean.
 */

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // No-op — Sentry DSN not configured
    return;
  }
  // When Sentry SDK is installed:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.init({ dsn, tracesSampleRate: 0.1, environment: process.env.NODE_ENV });
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // Fall back to console when Sentry is not configured
    if (process.env.NODE_ENV !== "test") {
      console.error("[error]", err, context ?? "");
    }
    return;
  }
  // When Sentry SDK is installed:
  // import * as Sentry from "@sentry/nextjs";
  // Sentry.captureException(err, { extra: context });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  // Sentry.captureMessage(message, level);
  void level;
}
