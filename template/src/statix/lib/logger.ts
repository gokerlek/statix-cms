/**
 * Lightweight structured logger with a replaceable transport.
 *
 * Default transport is `console.*`. If you want to send logs somewhere else,
 * implement the `Logger` interface below and register it once at app
 * startup via `setLogger(yourLogger)`. The template ships with zero
 * third-party dependencies for logging — you bring your own.
 */

export interface LogFields {
  /** Correlation ID — typically from `errorId()` — to join with server logs. */
  errorId?: string;
  /** Route or operation the log originated from, e.g. `"/api/content/…"`. */
  route?: string;
  /** Any additional structured context. */
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(error: unknown, fields?: LogFields): void;
}

export const consoleLogger: Logger = {
  debug(message, fields) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug(`[debug] ${message}`, fields ?? {});
    }
  },
  info(message, fields) {
    // eslint-disable-next-line no-console
    console.info(`[info] ${message}`, fields ?? {});
  },
  warn(message, fields) {
    // eslint-disable-next-line no-console
    console.warn(`[warn] ${message}`, fields ?? {});
  },
  error(error, fields) {
    // eslint-disable-next-line no-console
    console.error(`[error]`, error, fields ?? {});
  },
};

let activeLogger: Logger = consoleLogger;

/**
 * Replace the active logger. Call this once during app startup
 * (e.g. from `instrumentation.ts`) with any object that implements `Logger`.
 */
export function setLogger(logger: Logger): void {
  activeLogger = logger;
}

/**
 * Get the active logger. Kept async for API backwards-compatibility with the
 * previous lazy-init implementation; callers that `await` the result keep
 * working after the transport simplification.
 */
export async function getLogger(): Promise<Logger> {
  return activeLogger;
}
