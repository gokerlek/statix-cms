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
 * Consumed by:
 * - `drizzle.config.ts`
 * - `scripts/seed-admin.ts`
 */
import { z } from "zod";

const migrationEnvSchema = z.object({
  TURSO_DATABASE_URL: z.string().min(1, "TURSO_DATABASE_URL is required"),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN is required"),
});

export type MigrationEnv = z.infer<typeof migrationEnvSchema>;

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
