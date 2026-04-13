import { NextResponse } from "next/server";

import { ROUTES } from "@/statix/lib/constants";
import { checkRateLimit, getClientIp } from "@/statix/lib/rate-limit";

import type { NextRequest } from "next/server";

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ["/api/auth", "/api/media/serve"];

// Rate limit config: 100 requests per minute
const RATE_LIMIT_CONFIG = { limit: 100, windowSeconds: 60 };

// Better Auth session cookie name (default, no custom prefix configured)
const SESSION_COOKIE = "better-auth.session_token";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // CSRF protection: verify Origin header on mutation requests
  if (request.method !== "GET" && request.method !== "HEAD") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      const originHost = new URL(origin).host;

      if (originHost !== host) {
        return NextResponse.json(
          { error: "CSRF validation failed" },
          { status: 403 },
        );
      }
    }
  }

  // Apply rate limiting to API routes (except auth)
  if (path.startsWith("/api") && !path.startsWith("/api/auth")) {
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = checkRateLimit(clientIp, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
            ),
            "X-RateLimit-Limit": String(RATE_LIMIT_CONFIG.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimitResult.resetTime),
          },
        },
      );
    }
  }

  // Lightweight session check via cookie presence (no DB access — Edge-safe).
  // Full DB-backed session validation is enforced inside every route handler
  // via requireAdmin() / getSession(). Middleware only handles routing.
  const hasSession = request.cookies.has(SESSION_COOKIE);

  // Check if this is a public API route
  const isPublicApiRoute = PUBLIC_API_ROUTES.some((route) =>
    path.startsWith(route),
  );

  // Determine if route needs protection
  const isProtectedRoute =
    path.startsWith(ROUTES.ADMIN.ROOT) ||
    (path.startsWith("/api") && !isPublicApiRoute);

  if (isProtectedRoute && !hasSession) {
    // For API routes, return 401 JSON response
    if (path.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For page routes, redirect to sign in
    const signInUrl = new URL(ROUTES.AUTH.SIGNIN, request.url);

    signInUrl.searchParams.set("callbackUrl", request.url);

    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
