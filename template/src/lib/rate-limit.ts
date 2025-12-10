/**
 * Simple in-memory rate limiter for API routes
 * For production with multiple instances, consider using Redis
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(
  () => {
    const now = Date.now();

    cache.forEach((entry, key) => {
      if (entry.resetTime < now) {
        cache.delete(key);
      }
    });
  },
  60 * 1000, // Clean every minute
);

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
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result with remaining requests info
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowSeconds: 60 },
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
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
 * Get client IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  // Check common headers for proxied requests
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");

  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}
