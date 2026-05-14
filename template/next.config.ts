import type { NextConfig } from "next";

import { buildCSP, buildReportingEndpoints } from "@/statix/lib/csp";
import { env } from "@/statix/lib/env";

// next/image remotePatterns and CSP source allowlists need the media host
// at build time. When R2 isn't configured (zero-config local dev) we just
// skip the entry — the rest of the app still builds.
const mediaHost = env.NEXT_PUBLIC_MEDIA_BASE_URL
  ? new URL(env.NEXT_PUBLIC_MEDIA_BASE_URL).hostname
  : null;

const cspValue = buildCSP({
  NODE_ENV: process.env.NODE_ENV ?? "production",
  NEXT_PUBLIC_MEDIA_BASE_URL: env.NEXT_PUBLIC_MEDIA_BASE_URL,
  CSP_REPORT_URI: env.CSP_REPORT_URI,
});

const reportingEndpoints = buildReportingEndpoints({
  NODE_ENV: process.env.NODE_ENV ?? "production",
  NEXT_PUBLIC_MEDIA_BASE_URL: env.NEXT_PUBLIC_MEDIA_BASE_URL,
  CSP_REPORT_URI: env.CSP_REPORT_URI,
});

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      ...(mediaHost
        ? [{ protocol: "https" as const, hostname: mediaHost }]
        : []),
    ],
  },

  // Allow larger file uploads (50MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // --- Content Security Policy (Report-Only window) ---
          // We ship CSP in report-only mode first so we can observe any
          // violation reports from ProseKit / Recharts / third-party scripts
          // before enforcing. When the dashboard is clean for ~1 week, flip
          // to the enforcing header (`Content-Security-Policy`) in a follow-up.
          { key: "Content-Security-Policy-Report-Only", value: cspValue },
          ...(reportingEndpoints
            ? [{ key: "Reporting-Endpoints", value: reportingEndpoints }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
