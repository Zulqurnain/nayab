/**
 * Layer 4 & 8: Next.js middleware for auth protection and security headers.
 * Protects /dashboard and /settings routes.
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

    // Layer 8: Security headers
    // Content-Security-Policy
    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: https:`,
      `font-src 'self'`,
      `connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.duckduckgo.com https://api.gumroad.com`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join("; ");

    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("X-Nonce", nonce);
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );

    return res;
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        // Protect /dashboard and /settings
        if (
          pathname.startsWith("/dashboard") ||
          pathname.startsWith("/settings")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|llms.txt|sitemap.xml|index.md).*)",
  ],
};
