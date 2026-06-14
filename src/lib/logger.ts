/**
 * Layer 12: Structured JSON logging with Winston + daily rotation.
 * Logs go to /var/log/nayab/
 */
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";

const LOG_DIR = process.env.LOG_DIR ?? "/var/log/nayab";

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // If we can't create it, fall back to stdout-only
  }
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    silent: process.env.NODE_ENV === "test",
  }),
];

// Only add file transports if directory is writable
if (fs.existsSync(LOG_DIR)) {
  transports.push(
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: "nayab-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      format: jsonFormat,
      level: "info",
    }) as winston.transport,
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: "nayab-error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: "30d",
      level: "error",
      format: jsonFormat,
    }) as winston.transport
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: jsonFormat,
  transports,
});

/** Log an API request with timing and context */
export function logRequest(params: {
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  userId?: string | null;
  ip?: string;
  error?: unknown;
}) {
  const level = params.statusCode >= 500 ? "error" : params.statusCode >= 400 ? "warn" : "info";
  logger.log(level, "api_request", {
    method: params.method,
    path: params.path,
    statusCode: params.statusCode,
    latencyMs: params.latencyMs,
    userId: params.userId ?? null,
    ip: params.ip ?? "unknown",
    ...(params.error
      ? {
          error:
            params.error instanceof Error
              ? params.error.message
              : String(params.error),
        }
      : {}),
  });
}
