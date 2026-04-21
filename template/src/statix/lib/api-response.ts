import { NextResponse } from "next/server";

import { AppError, errorId } from "./errors";
import { getLogger } from "./logger";

/**
 * Handle a caught error in an API route / server function.
 *
 * Responsibilities:
 * - Map `AppError` + legacy string-based errors (`"Unauthorized"`, `"Forbidden"`)
 *   to the right HTTP status.
 * - Attach a correlation ID (`errorId`) to every non-auth failure so the
 *   client response and the server log line can be cross-referenced.
 * - Forward the exception + ID to the structured logger (optional Sentry).
 *
 * Signature unchanged for callers that pass two args — the optional third
 * `request` argument enriches the log line with the route path.
 */
export async function handleApiError(
  error: unknown,
  fallbackMessage: string,
  request?: Request,
) {
  const id = errorId();
  const route = request ? new URL(request.url).pathname : undefined;

  // AppError-flavoured errors carry their own status + message.
  if (error instanceof AppError) {
    if (error.status >= 500) {
      const logger = await getLogger();
      logger.error(error, { errorId: id, route });
    }
    return NextResponse.json(
      {
        error: error.message,
        ...(error.status >= 500 ? { errorId: id } : {}),
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status },
    );
  }

  // Legacy string-based error pattern used in the existing codebase.
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden" || error.message.startsWith("Forbidden:")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
  }

  // Unknown 5xx — log with correlation ID.
  const logger = await getLogger();
  logger.error(error, { errorId: id, route });

  return NextResponse.json(
    { error: fallbackMessage, errorId: id },
    { status: 500 },
  );
}
