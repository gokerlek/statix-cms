import { z } from "zod";

/**
 * Dev-only Better Auth secret fallback. Code below warns once at boot if
 * this value is used, and the production guard refuses to start with it.
 * Never use this value for anything except local development.
 */
const DEV_AUTH_SECRET = "dev-only-unsafe-secret-replace-before-deploy";

const envSchema = z.object({
  // GitHub content storage. Required at runtime for any content read/write,
  // but allowed empty at boot so a fresh scaffold can run `npm run dev`
  // and reach /auth/signin without crashing. github-cms.ts surfaces a
  // clear error if invoked without these set.
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().optional(),
  GITHUB_REPO: z.string().optional(),
  GITHUB_BRANCH: z.string().default("main"),

  // Better Auth — secret has a loud dev fallback so the app boots
  // without env config; production guard rejects the fallback below.
  BETTER_AUTH_SECRET: z.string().default(DEV_AUTH_SECRET),
  BETTER_AUTH_URL: z
    .string()
    .url("BETTER_AUTH_URL must be a valid URL")
    .default("http://localhost:3000"),

  // GitHub / Google OAuth — optional social sign-in providers
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Production: libsql/Turso remote. Local dev: leave both empty to fall
  // back to a libsql file at ./local.db (see lib/db.ts and drizzle.config.ts).
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),

  // Resend (OTP email). Optional in dev — when missing, auth.ts logs the
  // OTP code to the server console so a developer can still sign in.
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .email("RESEND_FROM_EMAIL must be a valid email")
    .optional(),

  // Cloudflare R2 (media storage) — all optional. UI shows a "media not
  // configured" empty state when missing; uploads return a clear 503.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  NEXT_PUBLIC_MEDIA_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_MEDIA_BASE_URL must be a valid URL (e.g. https://pub-xxx.r2.dev)")
    .optional(),

  // CSP violation report-to endpoint (optional)
  CSP_REPORT_URI: z.string().url().optional(),

  // Bootstrap — first admin (delete after `npm run seed:admin`)
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),

  // Proxy / rate-limit hardening
  /** Number of trusted proxies in front of the app (e.g. 1 for Vercel/Cloudflare). Used by getClientIp to pick the correct XFF hop. */
  TRUSTED_PROXY_COUNT: z.coerce.number().int().min(0).default(1),

  // Vercel auto-injected — used to build trustedOrigins for preview + production
  VERCEL_URL: z.string().optional(),
  VERCEL_BRANCH_URL: z.string().optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error(
      "Invalid environment variables. Check console for details.",
    );
  }

  const env = result.data;
  const isProd =
    env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  // Production guard: refuse to start with development fallbacks or
  // missing essentials. In dev these are downgraded to warnings so the
  // user can boot, browse the UI, and configure things at their own pace.
  if (isProd) {
    const missing: string[] = [];
    if (env.BETTER_AUTH_SECRET === DEV_AUTH_SECRET) {
      missing.push("BETTER_AUTH_SECRET (currently using unsafe dev fallback)");
    }
    if (!env.GITHUB_TOKEN) missing.push("GITHUB_TOKEN");
    if (!env.GITHUB_OWNER) missing.push("GITHUB_OWNER");
    if (!env.GITHUB_REPO) missing.push("GITHUB_REPO");
    if (!env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!env.RESEND_FROM_EMAIL) missing.push("RESEND_FROM_EMAIL");
    if (!env.NEXT_PUBLIC_MEDIA_BASE_URL) {
      missing.push("NEXT_PUBLIC_MEDIA_BASE_URL");
    }
    if (missing.length > 0) {
      throw new Error(
        `Production startup blocked — required env vars missing:\n` +
          missing.map((m) => `  - ${m}`).join("\n") +
          `\nSet these in your hosting provider's environment configuration.`,
      );
    }
  } else {
    // Dev warnings (once per server start)
    const warn: string[] = [];
    if (env.BETTER_AUTH_SECRET === DEV_AUTH_SECRET) {
      warn.push(
        "BETTER_AUTH_SECRET is unset — using an UNSAFE dev fallback. Set it before deploying.",
      );
    }
    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
      warn.push(
        "GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO missing — content reads will fail until configured.",
      );
    }
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
      warn.push(
        "RESEND_API_KEY / RESEND_FROM_EMAIL missing — OTP codes will be logged to the server console instead of emailed.",
      );
    }
    if (!env.NEXT_PUBLIC_MEDIA_BASE_URL) {
      warn.push(
        "NEXT_PUBLIC_MEDIA_BASE_URL missing — media uploads will return 503 until configured.",
      );
    }
    if (warn.length > 0) {
      // Single block so it's visible in `next dev` output, easy to grep.
      console.warn(
        "\n[statix] Some env vars are not set:\n" +
          warn.map((w) => `  • ${w}`).join("\n") +
          "\n",
      );
    }
  }

  return env;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
