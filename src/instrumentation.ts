/**
 * Layer 12: Next.js instrumentation hook for server-side error capture.
 * This runs once when the server starts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initSentry } = await import("./lib/sentry");
    initSentry();

    const { logger } = await import("./lib/logger");
    logger.info("server_start", {
      env: process.env.NODE_ENV,
      version: process.env.npm_package_version ?? "1.0.0",
      pid: process.pid,
    });

    // Capture unhandled rejections
    process.on("unhandledRejection", (reason) => {
      logger.error("unhandled_rejection", {
        error: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });

    process.on("uncaughtException", (err) => {
      logger.error("uncaught_exception", {
        error: err.message,
        stack: err.stack,
      });
    });
  }
}
