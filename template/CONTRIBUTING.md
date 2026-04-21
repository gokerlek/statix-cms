# Contributing to Statix CMS

Thanks for your interest in improving Statix CMS. This template ships as the `create-statix-cms` npm package — fixes here flow to every new project scaffolded from it.

## Quick start

```bash
git clone https://github.com/gokerlek/statix-cms.git
cd statix-cms/template
npm install
cp .env.example .env.local   # fill in your Turso / R2 / Resend / GitHub values
npm run dev
```

## Development workflow

### Before you start

1. Create a feature branch off `main` — never commit directly to `main`.
2. Run `npm install` — this activates Husky hooks automatically via the `prepare` script.

### While you work

- `npm run dev` — start the dev server (Turbopack).
- `npm run lint` — ESLint (auto-fix: `npm run lint -- --fix`).
- `npm run typecheck` — TypeScript strict check, no emit.
- `npm test` — Vitest once; `npm run test:watch` for watch mode.
- `npm run test:coverage` — coverage report (v8).

### Before you commit

Pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files). Pre-push hook runs `typecheck` + `test`. Both gates must pass.

Do NOT bypass hooks (`--no-verify`) unless you understand the risk and document why in the commit message.

### Commit message style

Short, imperative. Examples:

- `feat(auth): tighten OTP rate-limit`
- `fix(media): prevent double upload race`
- `refactor(proxy): move CSRF check above rate-limit`
- `docs: add SECURITY.md`

## Code style

- **TypeScript strict** — no `any` unless you justify it with a comment.
- **ESLint + Prettier** — config in the repo; let the tools format.
- **Import order** — handled by `simple-import-sort`.
- **Naming** — camelCase for functions/vars, PascalCase for types/components, UPPER_SNAKE for constants.
- **No Turkish in code or UI text** — all strings go through `content/ui.json`.

## Testing

- Unit tests next to the code: `src/foo/__tests__/foo.test.ts`.
- Prefer behaviour tests over implementation tests.
- For React components, use `@testing-library/react` queries in priority order (role > label > text).

## Security-relevant changes

If your change touches auth, rate-limit, path validation, CSP, or any input that ends up in a system call, ping a second reviewer and link to `SECURITY.md`. Do not merge alone.

## Reporting issues

Security issues: read `SECURITY.md` first. Everything else: open a GitHub issue.
