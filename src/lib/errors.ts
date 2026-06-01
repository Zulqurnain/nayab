/**
 * Layer 2: Standardised error response format.
 * { error: { code, message, details? } }
 */
import { NextResponse } from "next/server";

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  const body: { error: ApiError } = {
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

export const Errors = {
  badRequest: (msg = "Bad request", details?: unknown) =>
    errorResponse("BAD_REQUEST", msg, 400, details),
  unauthorized: (msg = "Authentication required") =>
    errorResponse("UNAUTHORIZED", msg, 401),
  paymentRequired: (msg = "Paid plan required") =>
    errorResponse("PAYMENT_REQUIRED", msg, 402),
  forbidden: (msg = "Forbidden") =>
    errorResponse("FORBIDDEN", msg, 403),
  notFound: (msg = "Not found") =>
    errorResponse("NOT_FOUND", msg, 404),
  tooManyRequests: (msg = "Rate limited. Please wait before sending another message.", retryAfterMs = 5000) => {
    const res = errorResponse("RATE_LIMITED", msg, 429);
    res.headers.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
    return res;
  },
  tooLarge: (msg = "Request too large") =>
    errorResponse("REQUEST_TOO_LARGE", msg, 413),
  internal: (msg = "Internal server error") =>
    errorResponse("INTERNAL_ERROR", msg, 500),
  serviceUnavailable: (msg = "Service unavailable") =>
    errorResponse("SERVICE_UNAVAILABLE", msg, 503),
};
