import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "./db";
import * as schema from "@/statix/db/schema";
import { env } from "./env";
import { writeAudit } from "./audit";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite", schema }),

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
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: email,
          subject: "Giriş kodunuz",
          text: `Kodunuz: ${otp}\n\nBu kod 5 dakika geçerlidir.`,
        });
      },
    }),
    admin(),
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
