/**
 * Minimum env schema for database migration / seed scripts.
 *
 * The main `src/statix/lib/env.ts` validates ALL app-level env vars at module
 * load and throws on missing values — this breaks `drizzle-kit` and seed
 * scripts which only need DB credentials.
 *
 * This file intentionally parses a minimal subset so CLI tooling keeps working
 * without requiring `GITHUB_TOKEN`, `RESEND_API_KEY`, `R2_*`, etc.
 *
 * Behaviour:
 * - TURSO_DATABASE_URL set → use libsql/Turso (production / remote dev).
 * - TURSO_DATABASE_URL empty → fall back to `file:./local.db` so a freshly
 *   scaffolded project can run `db:push` and `seed:admin` with zero config.
 *
 * Consumed by:
 * - `drizzle.config.ts`
 * - `scripts/seed-admin.ts`
 */
import { z } from "zod";

const migrationEnvSchema = z.object({
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
});

export type MigrationEnv = z.infer<typeof migrationEnvSchema>;

export interface ResolvedDbCredentials {
  /** "turso" when TURSO_DATABASE_URL is configured, else "sqlite" (local file). */
  dialect: "turso" | "sqlite";
  url: string;
  authToken?: string;
}

export function loadMigrationEnv(): MigrationEnv {
  const parsed = migrationEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(
      "❌ Migration env validation failed:\n",
      parsed.error.issues
        .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
        .join("\n"),
    );
    process.exit(1);
  }

  return parsed.data;
}

/**
 * Resolve the actual DB credentials to use. Centralised so drizzle-kit,
 * runtime db.ts, and seed scripts agree on local-vs-remote.
 */
export function resolveDbCredentials(): ResolvedDbCredentials {
  const env = loadMigrationEnv();
  if (env.TURSO_DATABASE_URL) {
    return {
      dialect: "turso",
      url: env.TURSO_DATABASE_URL,
      authToken: env.TURSO_AUTH_TOKEN,
    };
  }
  return { dialect: "sqlite", url: "file:./local.db" };
}
