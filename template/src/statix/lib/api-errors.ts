import { NextResponse } from "next/server";

import { APIError } from "better-auth/api";

/**
 * Normalises errors thrown from route handlers into proper HTTP responses.
 *
 * Why this exists:
 * - `requireSession()` throws `Error("Unauthorized")` → must become 401, not 500.
 * - `requirePermission()` throws `Error("Forbidden: missing X")` → 403, not 500.
 * - Better Auth's own `APIError` exposes a numeric `statusCode` we should honour.
 * - Anything else is genuinely unexpected and maps to 500 with the original
 *   error logged server-side (never leaked to the client).
 *
 * Usage:
 *   export async function GET() {
 *     try {
 *       await requireSession();
 *       // ...
 *     } catch (error) {
 *       return mapErrorToResponse(error);
 *     }
 *   }
 */
export function mapErrorToResponse(error: unknown): NextResponse {
  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode },
    );
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
  }

  console.error("Unhandled API error:", error);

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}
