import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "./env";

/**
 * libsql client — accepts either:
 *   - a remote Turso `libsql://...` URL with `authToken`, or
 *   - a local file URL like `file:./local.db` with no token.
 *
 * Falling back to local is what makes `npm run dev` work on a freshly
 * scaffolded project before Turso is configured.
 */
const client = createClient(
  env.TURSO_DATABASE_URL
    ? { url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN }
    : { url: "file:./local.db" },
);

export const db = drizzle(client);
