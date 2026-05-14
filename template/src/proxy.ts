import { NextResponse } from "next/server";

import { ROUTES } from "@/statix/lib/constants";
import { checkRateLimit, getClientIp } from "@/statix/lib/rate-limit";

import type { NextRequest } from "next/server";

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ["/api/auth", "/api/media/serve"];

// Rate-limit tiers
const API_RATE_LIMIT = { limit: 100, windowSeconds: 60 } as const;
// Public read-heavy endpoint — a single admin page mount can trigger 10+ image
// fetches via SSR + hydration. A lower limit produces self-429. Loosen it here.
const MEDIA_SERVE_RATE_LIMIT = { limit: 300, windowSeconds: 60 } as const;

// Better Auth session cookie name (default, no custom prefix configured)
const SESSION_COOKIE = "better-auth.session_token";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;
  const isAuthPath = path.startsWith("/api/auth");

  // --- CSRF (only for non-auth mutations) ---
  // Better Auth handles CSRF for /api/auth/* itself (state param + cookie +
  // trustedOrigins). Applying Origin=fail-closed there would break legitimate
  // flows like OAuth callback redirects or mobile webview POSTs that omit
  // Origin. For every other mutation endpoint we require Origin to match Host.
  if (!isAuthPath && method !== "GET" && method !== "HEAD") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Fail-closed: missing Origin on a cross-site-capable method is rejected.
    if (!origin || !host) {
      return NextResponse.json(
        { error: "CSRF: missing Origin header" },
        { status: 403 },
      );
    }

    const originHost = new URL(origin).host;

    if (originHost !== host) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 },
      );
    }

    // Extra defense-in-depth for modern browsers: reject cross-site fetches.
    // Absent header => old browser or non-browser client => fall through to
    // Origin check result above (already passed).
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
      return NextResponse.json(
        { error: "CSRF: cross-site fetch rejected" },
        { status: 403 },
      );
    }
  }

  // --- Rate limiting ---
  // /api/auth/* is NOT rate-limited here — Better Auth has its own rateLimit +
  // customRules, and some endpoints (get-session, list-sessions) are polled
  // frequently enough that a shared bucket would self-DoS. See
  // src/statix/lib/auth.ts for the per-endpoint config.
  if (path.startsWith("/api") && !isAuthPath) {
    const clientIp = getClientIp(request.headers);

    // Pick the right bucket.
    const isMediaServe = path.startsWith("/api/media/serve");
    const key = isMediaServe ? `media:${clientIp}` : `api:${clientIp}`;
    const config = isMediaServe ? MEDIA_SERVE_RATE_LIMIT : API_RATE_LIMIT;

    const rl = checkRateLimit(key, config);

    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rl.resetTime - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.resetTime),
          },
        },
      );
    }
  }

  // --- Session routing ---
  // Lightweight session check via cookie presence. Full DB-backed validation is
  // enforced inside every route handler via requireAdmin() / getSession().
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isPublicApiRoute = PUBLIC_API_ROUTES.some((route) =>
    path.startsWith(route),
  );

  const isProtectedRoute =
    path.startsWith(ROUTES.ADMIN.ROOT) ||
    (path.startsWith("/api") && !isPublicApiRoute);

  if (isProtectedRoute && !hasSession) {
    if (path.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const signInUrl = new URL(ROUTES.AUTH.SIGNIN, request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
