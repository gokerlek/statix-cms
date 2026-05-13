# Statix CMS — Project Context for Claude

> **Loaded automatically every session.** Before flagging "bugs", proposing
> refactors, or doing code review, check the Decision Lens below.

## What this project IS

- **Free, open-source CMS template**, distributed as `create-statix-cms` npm package.
- Targeting the shadcn/ui directory + portfolio project.
- The end user runs `npx create-statix-cms my-app` and gets the **entire codebase
  copied into their repo**. They own every line. There is no SaaS layer, no
  runtime we control, no future "library upgrade" path we maintain for them.
- We are a starting point that saves users $15/month vs hosted CMS alternatives.

## What this project IS NOT

- Not a SaaS we operate.
- Not a black-box library that hides implementation.
- Not a "best-practices showcase" that mandates one specific pattern.
- Not responsible for the user's customizations.

## Decision Lens — Run BEFORE flagging anything

Ask in this order. Stop at the first match:

1. **Does the default code crash, leak data, or grant unintended access?**
   → Real bug. Fix it.
2. **Is this a security default that an unsophisticated user wouldn't know
   to add themselves (rate limits, MIME validation, ban checks, CSRF)?**
   → Template's responsibility. Fix it.
3. **Is this a docs/code mismatch that breaks first-run experience
   (env vars referenced in README don't match the code)?**
   → Real bug. Fix it.
4. **Is this a personal taste / pattern preference (component size,
   `any` usage, "I'd structure this differently", "could be more performant")?**
   → **DROP.** The user owns the code; if they prefer differently, they
   refactor. Documenting under "tech debt" is fine, blocking ship is not.
5. **Is this tech debt the user can fix later without breaking their app?**
   → Note it; don't block.

## Examples — ARE bugs (fix these)

- Required env var has no fallback → `npm run dev` crashes on fresh scaffold.
- API route lacks authorization check → privilege escalation.
- Auth flow doesn't redirect on success → user can't sign in.
- Default ships with stale dev artifacts (committed SQLite DB, maintainer's
  test data) → every user inherits them.
- Inconsistency in docs vs actual env vars → first-run failure.
- Better Auth client error path swallowed silently → no user feedback on failure.
- CMS panel button shown but its backing config is empty → button errors when clicked.

## Examples — NOT bugs (don't block ship, don't lecture)

- A 400-line React component. → User splits if they want.
- `any` types in business logic. → User tightens if they want.
- Two hooks using slightly different patterns. → User picks.
- No tests for every hook. → User writes for their critical paths.
- "I'd use feature X instead of pattern Y." → Pattern preference.
- "This could be more performant via memoization." → Speculative.
- "This dead code might be unused." → If it works, leaving it costs the user nothing; deleting it might bite if they were about to wire it up.
- "Inconsistent import style." → Cosmetic.

## Architectural Boundaries — DO NOT CROSS

The user's app and the Statix CMS code share the same Next.js project but
live in separate scopes. **Statix code must not leak into the user's layer.**

```
template/src/app/
├── layout.tsx        ← USER layer. Don't add Statix UI, providers, or
│                       imports here. The user can put marketing pages,
│                       a landing page, anything they want.
└── (statix)/
    ├── layout.tsx    ← STATIX shell. This is where Statix-only providers
    │                   (Toaster, etc.) belong.
    ├── auth/         ← Statix sign-in & invite screens
    ├── admin/        ← Statix admin panel
    └── api/          ← Statix API routes
```

Rules:
- **Never** add Statix-specific imports, providers, or components to
  `app/layout.tsx`. Add them to `app/(statix)/layout.tsx`.
- **Never** put Statix-only pages under `app/` outside `(statix)/`.
- A user can hand-write a route at `app/about/page.tsx` and it should
  render cleanly without inheriting any Statix UI.
- If you're tempted to put a global provider at root for "convenience",
  stop. Put it in `(statix)/layout.tsx` instead.

## Critical: Never Ship Real Credentials

`template/.env.local` (and any other `.env*` other than `.env.example`)
is the maintainer's real values: GITHUB_TOKEN, BETTER_AUTH_SECRET,
RESEND_API_KEY, R2 keys, etc.

Two facts that combine into a footgun:

1. `.env.local` is in `template/.gitignore`, so it's never committed.
2. `npm pack` and `bin/index.js`'s `copyRecursive` read the working
   directory — they don't care about git. Without explicit `.npmignore`
   + bin skip rules, those files end up in the tarball / scaffold.

Defenses in place:

- `.npmignore` at repo root excludes every `.env*` except `.env.example`.
- `bin/index.js` `copyRecursive` skips the same set at the top level.
- `template/.gitignore` already has `.env*`.

**Before any `npm publish` or change to packaging, verify:**

```
npm pack --dry-run | grep -i env
# Only template/.env.example may appear. Nothing else.
```

If you add a new env-related dotfile (`.env.staging`, `.env.test`,
`.env.vault`, …), confirm the regex in `bin/index.js` and the
`.npmignore` rules both catch it.

## Check for Existing Helpers BEFORE Adding New Ones

Before creating a new utility / hook / helper file:

1. **Grep the project first.** `grep -rln "what-I-want" src/`. The
   codebase already has solutions for most common concerns and they're
   usually better than what you'd write from scratch.
2. **Read the existing one carefully.** If it covers your need, use it.
   If it covers 80% of your need, extend it; don't fork it.
3. **Only create new when the existing helper genuinely doesn't fit.**
   Document why in the new file's header comment.

Examples of pre-existing helpers worth knowing:

- `lib/api-response.ts → handleApiError(error, fallbackMsg, request?)` —
  the canonical API-route error handler. Maps `AppError`, `Unauthorized`,
  `Forbidden:` strings, attaches correlation IDs, logs to structured
  logger. Do NOT create a parallel `mapErrorToResponse` etc.
- `lib/errors.ts → AppError, UnauthorizedError, ForbiddenError,
  NotFoundError` — throw these instead of `new Error("Forbidden: ...")`
  when you can; `handleApiError` understands them natively.
- `lib/api-schemas.ts → safePath, r2Key, r2KeySchema, mediaMoveSchema,
  fileDeleteSchema` — common zod schemas for path/key validation.
- `lib/file-validation.ts → validateFileUpload, sanitizeFilename,
  getMaxUploadSize` — image/file upload checks. Reuse before adding
  bespoke MIME/size logic.
- `hooks/use-translation.ts → useTranslation()` — `t(key, params)` for
  interpolated strings from `ui.json`. Don't import `ui.json` directly
  in client code.

When in doubt: search first, write second.

## Maintainer Tooling Stays Outside `template/`

The `template/` directory is **the user's project**. Anything inside it
gets copied into every scaffolded project verbatim.

**Do not put maintainer dev tooling inside `template/`.** Examples:

- Git hooks (husky), pre-commit linters (lint-staged) — the user gets
  to choose if and how they want commit-time enforcement. We don't
  silently install hooks into their repo.
- CI workflows that only the upstream project's secrets satisfy
  (those already live as `_github/` — restored to `.github/` at
  scaffold; ship if and only if the user can plausibly run them).
- Maintainer-only scripts ("release", "publish", "sync from upstream").

If you need a hook / script for the upstream repo's own development,
put it at the **repo root** (`/Volumes/projects/statix-cms/.husky/`,
`/Volumes/projects/statix-cms/scripts/`, etc.), never inside `template/`.

`.npmignore` is a second line of defense; the first is "don't put it
in template/ in the first place".

## Dependency Policy

New npm dependencies require justification.

- The user pays the maintenance cost. We don't.
- Prefer vanilla TS / existing deps over new packages.
- External services (Redis, paid APIs, hosted databases beyond Turso free tier)
  are not acceptable defaults — users want a CMS that runs free.

## Language / i18n

- All user-facing strings live in `template/src/statix/content/ui.json`.
- No hardcoded Turkish (or any language) in components or server code.
- Client: `useTranslation()` hook. Server: direct `ui.json` import.

## Maintainer-only files (don't ship to npm)

These are the maintainer's dev workspace and never reach end users:

- `.claude/` (this file's location — git-tracked but excluded from npm tarball)
- `.omc/`
- `template/local.db` (gitignored + npmignored)
- `template/.next`, `template/node_modules`, `template/coverage`
- Repo meta: `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/`

Cleanup before `npm publish` is handled by `.npmignore` at repo root.

## When in doubt

Ship-blocker only if: (a) default crashes, (b) default leaks/exposes,
(c) docs lie. Everything else → ship and let the user own it.

If you (Claude) are tempted to write a 10-item "improvement plan" full
of refactors and "would be nicer if…" items, **stop**. Re-read the
Decision Lens. Most of what you wrote belongs in a separate "tech debt
backlog" PR that the user may or may not ever care about.
