import { beforeEach, describe, expect, it, vi } from "vitest";

// env.ts is imported transitively by rate-limit.ts. Stub it to avoid the
// top-level validation throw when unit tests run without a .env file.
vi.mock("@/statix/lib/env", () => ({
  env: { TRUSTED_PROXY_COUNT: 1 },
}));

import { checkRateLimit, getClientIp } from "@/statix/lib/rate-limit";

function h(headers: Record<string, string>): Headers {
  return new Headers(headers);
}

describe("getClientIp", () => {
  it("prefers x-vercel-forwarded-for", () => {
    expect(
      getClientIp(
        h({
          "x-vercel-forwarded-for": "1.1.1.1",
          "cf-connecting-ip": "2.2.2.2",
          "x-real-ip": "3.3.3.3",
          "x-forwarded-for": "4.4.4.4, 5.5.5.5",
        }),
      ),
    ).toBe("1.1.1.1");
  });

  it("falls back to cf-connecting-ip", () => {
    expect(
      getClientIp(
        h({
          "cf-connecting-ip": "2.2.2.2",
          "x-forwarded-for": "4.4.4.4",
        }),
      ),
    ).toBe("2.2.2.2");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(h({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
  });

  it("uses last-hop XFF (trust=1) — rejects spoofed prefix", () => {
    // Attacker sends:  X-Forwarded-For: <attacker-spoof>, <real-client>
    // Trusted proxy appends nothing because Vercel sets x-vercel-forwarded-for.
    // With trust=1 we take parts.length - 1 = real-client.
    expect(
      getClientIp(h({ "x-forwarded-for": "9.9.9.9, 8.8.8.8" })),
    ).toBe("8.8.8.8");
  });

  it("returns 'unknown' when no header is present", () => {
    expect(getClientIp(h({}))).toBe("unknown");
  });

  it("handles XFF with a single hop", () => {
    expect(getClientIp(h({ "x-forwarded-for": "7.7.7.7" }))).toBe("7.7.7.7");
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset the module-level cache between tests by clearing all keys for
    // isolation. checkRateLimit uses globalThis.__statix_rl_cache.
    const g = globalThis as typeof globalThis & {
      __statix_rl_cache?: Map<string, unknown>;
    };
    g.__statix_rl_cache?.clear();
  });

  it("allows requests within the limit", () => {
    const cfg = { limit: 3, windowSeconds: 60 };
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("key-a", cfg).success).toBe(true);
    }
  });

  it("rejects the N+1-th request in the window", () => {
    const cfg = { limit: 2, windowSeconds: 60 };
    checkRateLimit("key-b", cfg);
    checkRateLimit("key-b", cfg);
    const third = checkRateLimit("key-b", cfg);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("isolates buckets by key prefix", () => {
    const cfg = { limit: 1, windowSeconds: 60 };
    // Exhaust the `auth:` bucket.
    checkRateLimit("auth:1.1.1.1", cfg);
    const authSecond = checkRateLimit("auth:1.1.1.1", cfg);
    expect(authSecond.success).toBe(false);

    // Same IP but different bucket (media) still has budget.
    const mediaFirst = checkRateLimit("media:1.1.1.1", cfg);
    expect(mediaFirst.success).toBe(true);
  });

  it("returns a useful resetTime", () => {
    const cfg = { limit: 1, windowSeconds: 10 };
    const before = Date.now();
    const res = checkRateLimit("key-c", cfg);
    expect(res.resetTime).toBeGreaterThanOrEqual(before + 10 * 1000 - 50);
  });
});
