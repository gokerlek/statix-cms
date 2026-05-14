import { defineConfig } from "drizzle-kit";

import { resolveDbCredentials } from "@/statix/db/env-migration";

const { dialect, url, authToken } = resolveDbCredentials();

export default defineConfig({
  schema: "./src/statix/db/schema.ts",
  out: "./drizzle",
  dialect,
  dbCredentials: dialect === "turso" ? { url, authToken } : { url },
});
