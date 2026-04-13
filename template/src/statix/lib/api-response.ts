import { NextResponse } from "next/server";

/**
 * Handle caught errors in API routes with consistent format.
 * Extracts auth errors (Unauthorized/Forbidden) and returns proper status codes.
 */
export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden" || error.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
  }

  console.error(fallbackMessage, error);

  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
