import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/chat",

  // Layer 3 & 12: External packages that need native bindings
  serverExternalPackages: ["pdf-parse", "better-sqlite3", "winston", "winston-daily-rotate-file"],

  // Layer 2: API versioning + Layer 8: Security headers
  async headers() {
    return [
      {
        // Layer 8: HSTS and security headers for all routes
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Layer 10: Immutable cache on static assets
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Layer 10: Cache public assets
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },

  // Layer 8: Disable x-powered-by header
  poweredByHeader: false,

  // Instrumentation hook is enabled by default in Next.js 15+
};

export default nextConfig;
