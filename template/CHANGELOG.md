# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Tests**: Vitest + Testing Library + jsdom test harness. 80+ tests across `cn()`, `sanitizeFilename()`, rate-limit IP resolver + spoof reject, path validation (safePath, r2Key, storageFilename), CSP builder, slugify (with Turkish collision cases), and slug-index.
- **CI**: GitHub Actions workflow (`ci.yml`) — Node 20/22 matrix; lint + typecheck + test + build + `npm audit`.
- **CodeQL**: Weekly security scan workflow (`codeql.yml`).
- **Pre-commit / pre-push hooks**: Husky + lint-staged — `pre-commit` runs ESLint + Prettier on staged files; `pre-push` runs typecheck + tests.
- `docs/canary-audit.md`: Next.js 16 / React 19.2 / Better Auth 1.5.6 migration audit.
- **Relation field** (`type: "relation"`) for cross-collection links with `multiple` support and display-field override. See `src/statix/components/fields/RelationField.tsx`.
- **⌘K / Ctrl+K CommandPalette** — global RBAC-filtered search across collections; debounced; keyboard shortcut with visible `<Kbd>` primitive.
- **Slug uniqueness check** — collection-scoped; skips singletons; 60s `unstable_cache` with per-collection `slugs-<slug>` tag invalidated on save; 250-item safety limit (larger collections fall back to the SHA-conflict retry path).
- **Global error boundary** (`src/app/global-error.tsx`) + **not-found pages** (root, route group, admin).
- **Structured logger with pluggable transport** (`src/statix/lib/logger.ts`). Default console; `setLogger(custom)` lets a bootstrap file plug in Sentry / Datadog / etc. without the template depending on those SDKs.
- **`AppError` + `errorId()` correlation ID** — every 5xx API response carries a UUID for log correlation.
- **`_meta` server-injection** — `createdAt` / `createdBy` / `updatedAt` / `updatedBy` are now server-controlled; user payload is ignored (prevents spoofing).

### Changed

- **Next.js 16.2.4 stable + React 19.2.5 stable** (from `next@16.1.0-canary.19`).
- `src/middleware.ts` renamed to `src/proxy.ts` — Next.js 16 convention. Function `middleware` renamed to `proxy`. Edge runtime no longer supported (Node.js only by default).
- **IP resolver hardened** — `x-vercel-forwarded-for` → `cf-connecting-ip` → `x-real-ip` → last-hop of `x-forwarded-for` (configurable via `TRUSTED_PROXY_COUNT`). Spoofed leading XFF entries no longer shift the rate-limit bucket.
- **Better Auth rate-limit** — per-endpoint `customRules` covering OTP flood, OAuth callbacks, sign-up/verify/reset paths, and loose poll-endpoint tiers for `/get-session`.
- **Rate-limit store** — HMR-safe `globalThis` guard; lazy-sweep instead of `setInterval` in production to avoid per-cold-start timer leaks.
- **CSP (Report-Only)** — new content-security-policy via `src/statix/lib/csp.ts`; build from `NEXT_PUBLIC_MEDIA_BASE_URL` + optional `SENTRY_DSN` / `CSP_REPORT_URI`. HSTS now includes `preload`.
- **`safePath` / `r2Key` / `storageFilename`** — NFC-normalize, reject URL-encoded traversal, null bytes, backslash, dot-dot sequences, leading-slash and legacy `public/` prefix (rewritten for compatibility instead of rejected).
- **`/api/media/serve/[...path]`** prefix list now single-source-of-truth — adds `files/` to the public tier so `/api/file` uploads actually serve.
- **`/api/trash/media/[filename]`** filename validator replaces inline regex — blocks `..` sequences.
- **`slugify()`** — Unicode-aware; Turkish characters (`ç/ğ/ı/İ/ö/ş/ü`) map to ASCII, accents strip via NFKD. `slugify("Türkiye") === slugify("türkiye")` so the uniqueness check actually catches duplicates.
- **CSRF** — fail-closed on non-auth mutations (reject missing `Origin`); `/api/auth/*` delegated to Better Auth's own state/CSRF token mechanism to keep OAuth callbacks and mobile webview POSTs working. `Sec-Fetch-Site` adds a modern-browser second layer.
- **`contentSaveSchema`** — `_meta` is parsed-but-ignored (`z.unknown().optional()`); `id` is not in the schema and destructured away server-side; user cannot spoof `createdBy`, `createdAt`, or set the primary key.
- **Content route (`/api/content/[collectionSlug]/[id]`)** — triple `getFile()` consolidated into one canonical + legacy lookup; migration from legacy status-folder layout preserves `_meta.createdAt`.

### Deprecated

- `StatixConfig.mediaFolder` — unused by runtime (R2 prefix is `uploads/` hardcoded). Now `optional` with `@deprecated` JSDoc; will be removed in `v0.3.0`.

### Removed

- Duplicate implementation of `cn` / `resolveImageUrl` / `getGitHubRawUrl` / `slugify` / `formatFileSize` — `src/lib/utils.ts` re-exports from `src/statix/lib/utils.ts` to keep shadcn/ui's `@/lib/utils#cn` convention working while keeping a single source of truth.

### Fixed

- Legacy content JSON paths with `public/uploads/…` or `/uploads/…` prefixes no longer fail validation — they are transparently rewritten at parse time.
- `decodeURIComponent` inside `safePath` now `try/catch`es `URIError` so malformed `%XX` input returns 400 instead of bubbling up as 500.
- `ContentSaveSchema` no longer strips user-defined fields (title, blocks, …) — `.passthrough()` retained.

### Security

- OTP endpoint (`/email-otp/send-verification-otp`) is no longer unlimited — 3 requests/minute per IP via Better Auth `customRules`. Closes the Resend-quota DoS and OTP enumeration surface.
- `_meta.createdBy` / `_meta.createdAt` spoof closed — server always overwrites from the existing file or session.
- `/api/auth/*` middleware CSRF exemption prevents the fail-closed Origin check from breaking Better Auth's own state/cookie flow.
- CSP ships in Report-Only mode first; `v0.2.0` follow-up flips to enforcing once a 7-day violation-free window passes.

---

## [0.1.1] — prior release

Initial preview release. Base CMS template with Git + R2 storage, Better Auth email OTP + OAuth, RBAC, i18n, media trash, audit log.
