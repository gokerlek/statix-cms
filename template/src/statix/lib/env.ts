import { z } from "zod";

const envSchema = z.object({
  // GitHub Configuration (içerik depolama — korunur)
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
  GITHUB_OWNER: z.string().min(1, "GITHUB_OWNER is required"),
  GITHUB_REPO: z.string().min(1, "GITHUB_REPO is required"),
  GITHUB_BRANCH: z.string().default("main"),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),

  // GitHub OAuth (opsiyonel — sosyal giriş)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Google OAuth (opsiyonel — sosyal giriş)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Turso (kullanıcı veritabanı)
  TURSO_DATABASE_URL: z.string().min(1, "TURSO_DATABASE_URL is required"),
  TURSO_AUTH_TOKEN: z.string().min(1, "TURSO_AUTH_TOKEN is required"),

  // Resend (OTP email)
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL must be a valid email"),

  // Cloudflare R2 (medya depolama) — server-side credentials opsiyonel (drizzle-kit/seed bunları istemez);
  // ama public media URL build-time'da CSP/remotePatterns için gerekli — required.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  NEXT_PUBLIC_MEDIA_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_MEDIA_BASE_URL must be a valid URL (e.g. https://pub-xxx.r2.dev)"),

  // CSP violation report-to endpoint (opsiyonel — Cloudflare, Report URI, Sentry CSP ingest, etc.)
  CSP_REPORT_URI: z.string().url().optional(),

  // Bootstrap — ilk admin (kullanım sonrası silinir)
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

  return result.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
