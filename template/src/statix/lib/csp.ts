/**
 * Content Security Policy builder — derives a CSP string from env so the same
 * source of truth is reused by `next.config.ts` headers and documentation.
 *
 * Design notes:
 * - `script-src` needs `'unsafe-eval'` in development only (React dev + refresh).
 *   Production strips it.
 * - `style-src` keeps `'unsafe-inline'` because Recharts and ProseKit inject
 *   inline style attributes. The 7-day Report-Only window before we enforce
 *   (see `next.config.ts`) confirms whether a nonce-based policy is viable.
 * - `img-src` lists avatar + R2 media hostname explicitly. The R2 hostname is
 *   derived from `NEXT_PUBLIC_MEDIA_BASE_URL` at build time.
 * - `connect-src` includes GitHub API (Octokit), OAuth redirect origins, and
 *   optionally the Sentry origin when a DSN is configured.
 * - `frame-ancestors 'none'` is stricter than X-Frame-Options: DENY and covers
 *   every frame context.
 */

export interface CSPEnv {
  NODE_ENV: "development" | "production" | "test" | string;
  NEXT_PUBLIC_MEDIA_BASE_URL?: string | undefined;
  CSP_REPORT_URI?: string | undefined;
}

function parseHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function buildCSP(env: CSPEnv): string {
  const isDev = env.NODE_ENV === "development";
  const mediaHost = parseHost(env.NEXT_PUBLIC_MEDIA_BASE_URL);

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://avatars.githubusercontent.com",
      ...(mediaHost ? [`https://${mediaHost}`] : []),
    ],
    "media-src": [
      "'self'",
      "blob:",
      ...(mediaHost ? [`https://${mediaHost}`] : []),
    ],
    "worker-src": ["'self'", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://api.github.com",
      "https://accounts.google.com",
      "https://github.com",
    ],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  if (env.CSP_REPORT_URI) {
    directives["report-uri"] = [env.CSP_REPORT_URI];
    directives["report-to"] = ["csp-endpoint"];
  }

  return Object.entries(directives)
    .filter(([, values]) => values.length > 0)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Build the `Reporting-Endpoints` header value — required when a CSP uses
 * `report-to`. Returns `null` when no endpoint is configured.
 */
export function buildReportingEndpoints(env: CSPEnv): string | null {
  if (!env.CSP_REPORT_URI) return null;
  return `csp-endpoint="${env.CSP_REPORT_URI}"`;
}
