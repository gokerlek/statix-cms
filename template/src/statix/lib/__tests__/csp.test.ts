import { describe, expect, it } from "vitest";

import { buildCSP, buildReportingEndpoints } from "@/statix/lib/csp";

const baseEnv = {
  NODE_ENV: "production",
  NEXT_PUBLIC_MEDIA_BASE_URL: "https://pub-abc.r2.dev",
};

describe("buildCSP", () => {
  it("emits a complete policy for a production-like env", () => {
    const csp = buildCSP(baseEnv);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("img-src");
    expect(csp).toContain("https://pub-abc.r2.dev");
    expect(csp).toContain("https://avatars.githubusercontent.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("does not allow unsafe-eval in production", () => {
    const csp = buildCSP({ ...baseEnv, NODE_ENV: "production" });
    expect(csp).not.toContain("'unsafe-eval'");
  });

  it("allows unsafe-eval only in development (for React dev + refresh)", () => {
    const csp = buildCSP({ ...baseEnv, NODE_ENV: "development" });
    expect(csp).toContain("'unsafe-eval'");
  });

  it("adds report-uri + report-to when CSP_REPORT_URI is set", () => {
    const csp = buildCSP({
      ...baseEnv,
      CSP_REPORT_URI: "https://csp.example.com/report",
    });
    expect(csp).toContain("report-uri https://csp.example.com/report");
    expect(csp).toContain("report-to csp-endpoint");
  });

  it("omits report directives when CSP_REPORT_URI is missing", () => {
    const csp = buildCSP(baseEnv);
    expect(csp).not.toContain("report-uri");
    expect(csp).not.toContain("report-to");
  });

  it("gracefully skips R2 host if NEXT_PUBLIC_MEDIA_BASE_URL is malformed", () => {
    const csp = buildCSP({
      ...baseEnv,
      NEXT_PUBLIC_MEDIA_BASE_URL: "not-a-url",
    });
    // still emits a valid policy — just without the R2 host
    expect(csp).toContain("img-src");
    expect(csp).not.toContain("not-a-url");
  });
});

describe("buildReportingEndpoints", () => {
  it("returns null when no report URI is configured", () => {
    expect(buildReportingEndpoints(baseEnv)).toBeNull();
  });

  it("formats the Reporting-Endpoints value when a URI is present", () => {
    const value = buildReportingEndpoints({
      ...baseEnv,
      CSP_REPORT_URI: "https://csp.example.com/report",
    });
    expect(value).toBe('csp-endpoint="https://csp.example.com/report"');
  });
});
