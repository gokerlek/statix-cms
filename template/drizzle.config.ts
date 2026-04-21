import { defineConfig } from "drizzle-kit";

import { loadMigrationEnv } from "@/statix/db/env-migration";

const env = loadMigrationEnv();

export default defineConfig({
  schema: "./src/statix/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  },
});
