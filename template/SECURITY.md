# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.** Instead, email the maintainer directly at the address listed in `package.json → author` with:

- Affected version (`git rev-parse HEAD` from your local copy works).
- A minimal reproduction or proof-of-concept.
- The impact you observed (information disclosure, RCE, auth bypass, etc.).
- Your preferred credit line (or request to stay anonymous).

We acknowledge reports within **72 hours** and aim to ship a fix within **14 days** for high-severity findings. You will be credited in the CHANGELOG unless you ask otherwise.

## Supported versions

Statix CMS is pre-1.0. Only the latest minor version receives security patches.

| Version | Supported |
| ------- | --------- |
| 0.x     | ✅ (latest minor only) |

## Threat model (what we defend against)

- **Unauthorized admin access** — email-OTP + OAuth; RBAC enforced per collection and global permission.
- **CSRF** — Origin-header check on mutation requests for non-auth endpoints. Better Auth handles its own CSRF for `/api/auth/*`.
- **Brute force / credential stuffing** — Better Auth rate-limit + OTP attempt cap.
- **Path traversal** — Zod-validated storage paths (`safePath`) with NFC normalize, decoded re-check, dotdot reject.
- **XSS** — React default escape + Content Security Policy (Report-Only → Enforce).
- **Content spoofing** — `_meta` and `id` fields server-controlled; user payload ignored.
- **Rate-limit bypass via spoofed headers** — IP resolver uses `x-vercel-forwarded-for` / `cf-connecting-ip` first, falls back to last-hop of `X-Forwarded-For`.

## What we do NOT defend against (out of scope)

- Attacks that assume a compromised GitHub token, Resend API key, Turso credential, or R2 key — these live in the deployer's env and are not part of the template's defense surface.
- Physical access to the server or admin device.
- Supply-chain attacks on transitive dependencies — run `npm audit` in CI and monitor advisories yourself.
- Browser-level vulnerabilities (Spectre, rendering-engine bugs).

## Deployment hardening checklist

Before exposing an admin UI to the public internet:

- [ ] Set a strong `BETTER_AUTH_SECRET` (32+ random chars).
- [ ] Change `INITIAL_ADMIN_EMAIL` in `.env` before the first deploy. The default in `.env.example` is a placeholder — change it to your own.
- [ ] Restrict R2 bucket CORS to your domain(s).
- [ ] Use a public R2 domain (`pub-xxx.r2.dev`) or a custom domain — set `NEXT_PUBLIC_MEDIA_BASE_URL`.
- [ ] Enable HTTPS (Vercel / Cloudflare / Nginx) — HSTS header is pre-configured.
- [ ] For production: swap Better Auth's default in-memory rate-limit store for Redis / Upstash. See `docs/canary-audit.md` §6.
- [ ] Review `SECURITY.md` annually — threat landscape changes.

## Plugging in an error-reporting service

The template ships with a simple console logger and an extension point at
`src/statix/lib/logger.ts`. If you want to forward errors to Sentry, Datadog,
or Axiom, install the provider's SDK and register a custom logger at startup:

```ts
// src/instrumentation.ts
import * as Sentry from "@sentry/nextjs";
import { setLogger } from "@/statix/lib/logger";

export function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0,
    beforeSend(event) {
      // Scrub PII before it leaves the process.
      if (event.user?.email) event.user.email = "[redacted]";
      if (event.request?.headers?.["x-forwarded-for"]) {
        event.request.headers["x-forwarded-for"] = "[redacted]";
      }
      if (event.request?.cookies) event.request.cookies = {};
      return event;
    },
  });

  setLogger({
    debug: (m, f) => Sentry.captureMessage(m, "debug"),
    info:  (m, f) => Sentry.captureMessage(m, "info"),
    warn:  (m, f) => Sentry.captureMessage(m, "warning"),
    error: (err, f) => Sentry.captureException(err, { extra: f }),
  });
}
```

We don't bundle `@sentry/nextjs` as an optional peer dep because Turbopack
and webpack eagerly resolve every module specifier, so "optional" imports
still fail the build for users who haven't installed the package.
