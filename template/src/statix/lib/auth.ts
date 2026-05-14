import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "./db";
import * as schema from "@/statix/db/schema";
import { env } from "./env";
import { writeAudit } from "./audit";
import ui from "@/statix/content/ui.json";

// Resend is optional in dev. When credentials are missing, sendVerificationOTP
// logs the code to the server console so a developer can still sign in
// without configuring an email provider first.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Build trustedOrigins from env: always include the configured BETTER_AUTH_URL,
// and if we're running on Vercel, include the preview/production URL too so
// OAuth callbacks from Vercel-generated hostnames aren't rejected.
const trustedOrigins = [
  env.BETTER_AUTH_URL,
  ...(env.VERCEL_ENV === "preview" && env.VERCEL_BRANCH_URL
    ? [`https://${env.VERCEL_BRANCH_URL}`]
    : []),
  ...(env.VERCEL_ENV === "production" && env.VERCEL_URL
    ? [`https://${env.VERCEL_URL}`]
    : []),
];

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),

  trustedOrigins,

  // Global rate-limit — applied to all /api/auth/* endpoints. Middleware
  // delegates the whole /api/auth/* namespace here so poll endpoints
  // (get-session, list-sessions) don't self-429.
  //
  // NOTE: default storage is in-memory. For multi-instance / serverless prod
  // swap to Redis/Upstash (see SECURITY.md).
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      // OTP flood protection — expensive for the user (email delivery) and
      // for us (Resend quota). 3/minute is still friendly to typos.
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      // OTP verify — Better Auth's built-in allowedAttempts: 3 per OTP already
      // handles brute force; this caps retries across OTP regenerations.
      "/sign-in/email-otp": { window: 60, max: 10 },
      // OAuth callbacks — legitimate traffic is low, but keep it loose for
      // provider retries.
      "/callback/*": { window: 60, max: 30 },
      "/sign-up/*": { window: 60, max: 10 },
      "/verify-email": { window: 60, max: 10 },
      "/reset-password/*": { window: 60, max: 10 },
      "/forget-password": { window: 60, max: 5 },
      // Poll endpoints — generous to avoid self-DoS when multiple tabs are open
      // with React Strict Mode double-render × TanStack refetch.
      "/get-session": { window: 60, max: 300 },
      "/error": { window: 60, max: 60 },
      "/list-sessions": { window: 60, max: 300 },
    },
  },

  user: {
    additionalFields: {
      role: { type: "string", required: false },
      banned: { type: "boolean", required: false },
      banReason: { type: "string", required: false },
      banExpires: { type: "number", required: false },
      permissions: { type: "string", required: false },
    },
  },

  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await writeAudit({
            userId: session.userId,
            action: "auth.login",
            entityType: "auth",
            entityId: session.userId,
            ipAddress: (session as { ipAddress?: string | null }).ipAddress ?? null,
          });
        },
      },
      delete: {
        after: async (session) => {
          await writeAudit({
            userId: session.userId,
            action: "auth.logout",
            entityType: "auth",
            entityId: session.userId,
          });
        },
      },
    },
  },

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 dakika
      allowedAttempts: 3,
      resendStrategy: "rotate",
      async sendVerificationOTP({ email, otp }) {
        if (!resend || !env.RESEND_FROM_EMAIL) {
          // Dev convenience: surface the OTP in the server log so the
          // developer can copy-paste it into the sign-in form. The env
          // validator already warned about the missing config at boot.
          // eslint-disable-next-line no-console
          console.log(
            `\n[statix] Resend not configured — OTP for ${email}: ${otp}\n` +
              `         Set RESEND_API_KEY + RESEND_FROM_EMAIL in .env to send real emails.\n`,
          );
          return;
        }
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: email,
          subject: ui.email.otp.subject,
          text: ui.email.otp.body.replace("{otp}", otp),
        });
      },
    }),
    // IMPORTANT: nextCookies() MUST remain the last plugin.
    // It hooks into the response cycle to commit Set-Cookie headers from
    // every other plugin into Next.js's cookies() store. Any plugin placed
    // AFTER nextCookies() will set cookies that this plugin never sees,
    // and they will fail to persist in Server Component contexts. See:
    // https://www.better-auth.com/docs/integrations/next
    nextCookies(),
  ],

  socialProviders: {
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
});
