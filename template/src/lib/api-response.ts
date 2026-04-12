import { NextResponse } from "next/server";

/**
 * Handle caught errors in API routes with consistent format.
 * Extracts auth errors (Unauthorized/Forbidden) and returns proper status codes.
 */
export function handleApiError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Error &&
    (error.message === "Unauthorized" || error.message === "Forbidden")
  ) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === "Unauthorized" ? 401 : 403 },
    );
  }

  console.error(fallbackMessage, error);

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
