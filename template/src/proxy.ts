import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ROUTES } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

import type { NextRequest } from "next/server";

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ["/api/auth"];

// Rate limit config: 100 requests per minute
const RATE_LIMIT_CONFIG = { limit: 100, windowSeconds: 60 };

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

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

  const session = await auth();

  // Check if this is a public API route
  const isPublicApiRoute = PUBLIC_API_ROUTES.some((route) =>
    path.startsWith(route),
  );

  // Determine if route needs protection
  const isProtectedRoute =
    path.startsWith(ROUTES.ADMIN.ROOT) ||
    (path.startsWith("/api") && !isPublicApiRoute);

  if (isProtectedRoute && !session) {
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
