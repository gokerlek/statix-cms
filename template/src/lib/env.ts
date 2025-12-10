import { z } from "zod";

/**
 * Environment variable validation schema
 * Validates all required environment variables at build/runtime
 */
const envSchema = z.object({
  // GitHub Configuration (Required)
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
  GITHUB_OWNER: z.string().min(1, "GITHUB_OWNER is required"),
  GITHUB_REPO: z.string().min(1, "GITHUB_REPO is required"),
  GITHUB_BRANCH: z.string().default("main"),

  // NextAuth Configuration (Required)
  AUTH_GITHUB_ID: z.string().min(1, "AUTH_GITHUB_ID is required"),
  AUTH_GITHUB_SECRET: z.string().min(1, "AUTH_GITHUB_SECRET is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),

  // Admin Access Control (Required)
  ADMIN_EMAILS: z.string().min(1, "ADMIN_EMAILS is required"),

  // Optional
  NEXT_PUBLIC_MEDIA_BASE_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
});

/**
 * Validate environment variables
 * Call this at app startup to fail fast on missing config
 */
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

// Validate and export typed env
export const env = validateEnv();

// Type for environment variables
export type Env = z.infer<typeof envSchema>;
