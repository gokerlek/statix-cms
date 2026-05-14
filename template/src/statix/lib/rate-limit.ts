/**
 * Simple in-memory rate limiter for API routes.
 *
 * Characteristics:
 * - **Single-instance**: memory-backed cache; for multi-instance / serverless
 *   production use an external store (Redis, Upstash). See SECURITY.md.
 * - **HMR-safe**: the cleanup interval is guarded by a globalThis flag so
 *   Next.js hot-reload doesn't leak timers on every file edit.
 * - **Serverless-safe**: in production we skip the background interval and
 *   sweep lazily on every `checkRateLimit` call — because each serverless
 *   instance spins up its own timer otherwise.
 */

import { env } from "./env";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Use globalThis so HMR module re-runs reuse the same Map (and the same timer below).
const g = globalThis as typeof globalThis & {
  __statix_rl_cache?: Map<string, RateLimitEntry>;
  __statix_rl_interval?: NodeJS.Timeout;
};

const cache: Map<string, RateLimitEntry> = g.__statix_rl_cache ?? new Map();

if (!g.__statix_rl_cache) {
  g.__statix_rl_cache = cache;
}

function sweepExpired(now = Date.now()) {
  cache.forEach((entry, key) => {
    if (entry.resetTime < now) {
      cache.delete(key);
    }
  });
}

// Only set the interval in dev/test — serverless production creates a new timer
// per cold start, which leaks. In prod we rely on lazy sweep inside checkRateLimit.
if (process.env.NODE_ENV !== "production" && !g.__statix_rl_interval) {
  g.__statix_rl_interval = setInterval(() => sweepExpired(), 60 * 1000);
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique bucket key. For IP-based limits pass the result
 *   of `getClientIp(headers)`. Prefix keys by purpose to separate buckets,
 *   e.g. `media:${ip}` or `auth:${ip}`.
 * @param config - Rate limit configuration.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowSeconds: 60 },
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  // Lazy sweep — cheap, bounded by cache size.
  if (process.env.NODE_ENV === "production" && cache.size > 0) {
    // Only sweep if cache grows past a small threshold, to avoid O(n) per hit.
    if (cache.size > 256) sweepExpired(now);
  }

  const entry = cache.get(identifier);

  // No existing entry or expired
  if (!entry || entry.resetTime < now) {
    cache.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      success: true,
      remaining: config.limit - 1,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Extract a trustworthy client IP from proxied request headers.
 *
 * Priority order:
 * 1. `x-vercel-forwarded-for` — set by Vercel edge; closest to client.
 * 2. `cf-connecting-ip` — set by Cloudflare.
 * 3. `x-real-ip` — set by Nginx and similar.
 * 4. `x-forwarded-for` — we use the **last-but-N** hop where `N =
 *    TRUSTED_PROXY_COUNT`. This prevents spoofing by a client that sends its
 *    own `X-Forwarded-For: <attacker-ip>, <real-ip>`.
 * 5. `"unknown"` fallback.
 */
export function getClientIp(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const real = headers.get("x-real-ip");
  if (real) return real.trim();

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return "unknown";
    // Pick the IP that was inserted by the most-trusted hop.
    // For trust=1 (default Vercel): take the last entry (real client behind proxy).
    const trust = env.TRUSTED_PROXY_COUNT;
    const idx = Math.max(0, parts.length - trust);
    return parts[idx] ?? parts[parts.length - 1] ?? "unknown";
  }

  return "unknown";
}
