/**
 * Shared error primitives for API routes and server actions.
 *
 * - `AppError` carries a stable `status` code + optional `details`, so handlers
 *   can throw domain-shaped errors without reaching for `NextResponse` directly.
 * - `errorId()` generates a correlation ID that we attach to every 500 response
 *   so users can paste the ID into a bug report and we can grep logs for it.
 */

export class AppError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Generate a correlation ID for a failed request. Attached to 5xx responses
 * so users can reference it in bug reports.
 */
export function errorId(): string {
  return crypto.randomUUID();
}
