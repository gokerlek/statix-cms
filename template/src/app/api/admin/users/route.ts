import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, isNull, not, sql } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";

import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { user, userInvites } from "@/db/schema";
import { writeAudit, getIp } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const resend = new Resend(env.RESEND_API_KEY);

const banSchema = z.object({
  reason: z.string().max(500).optional(),
  expiresAt: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), { message: "expiresAt must be in the future" })
    .optional(),
});

export async function GET() {
  try {
    await requireAdmin();

    const result = await auth.api.listUsers({
      headers: await headers(),
      query: { limit: 100 },
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "Failed to list users");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await request.json();
    const { action, userId, email, role, banReason, banExpiresAt } = body;

    const reqHeaders = await headers();

    // Self-mutation guard — block destructive ops on own account, allow profile updates
    const selfAllowed = ["create", "invite", "updateName", "updateAvatar"];

    if (!selfAllowed.includes(action) && userId && userId === session.user.id) {
      return NextResponse.json(
        { error: "Kendi hesabınıza bu işlemi yapamazsınız" },
        { status: 400 },
      );
    }

    switch (action) {
      case "setRole": {
        // Last admin guard for demotion
        if (role !== "admin") {
          await db.transaction(
            async (tx) => {
              const [{ adminCount }] = await tx
                .select({ adminCount: count() })
                .from(user)
                .where(
                  and(
                    eq(user.role, "admin"),
                    not(eq(user.banned, true)),
                    not(eq(user.id, userId)),
                  ),
                );
              if (adminCount === 0) throw new Error("LastAdmin");
              await auth.api.setRole({
                headers: reqHeaders,
                body: { userId, role },
              });
            },
            { behavior: "immediate" },
          );
        } else {
          await auth.api.setRole({
            headers: reqHeaders,
            body: { userId, role },
          });
        }
        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.role_change",
          entityType: "user",
          entityId: userId,
          metadata: { role },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "ban": {
        const banParsed = banSchema.safeParse({ reason: banReason, expiresAt: banExpiresAt });
        if (!banParsed.success) {
          return NextResponse.json(
            { error: banParsed.error.issues[0]?.message ?? "Invalid ban parameters" },
            { status: 400 },
          );
        }

        // Last admin guard
        await db.transaction(
          async (tx) => {
            const [{ adminCount }] = await tx
              .select({ adminCount: count() })
              .from(user)
              .where(
                and(
                  eq(user.role, "admin"),
                  not(eq(user.banned, true)),
                  not(eq(user.id, userId)),
                ),
              );
            if (adminCount === 0) throw new Error("LastAdmin");

            await auth.api.banUser({
              headers: reqHeaders,
              body: {
                userId,
                ...(banParsed.data.reason ? { banReason: banParsed.data.reason } : {}),
                ...(banParsed.data.expiresAt
                  ? { banExpiresAt: new Date(banParsed.data.expiresAt).getTime() }
                  : {}),
              },
            });
          },
          { behavior: "immediate" },
        );

        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.ban",
          entityType: "user",
          entityId: userId,
          metadata: { banReason, banExpiresAt },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "unban": {
        await auth.api.unbanUser({
          headers: reqHeaders,
          body: { userId },
        });
        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.unban",
          entityType: "user",
          entityId: userId,
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "delete": {
        // Last admin guard
        await db.transaction(
          async (tx) => {
            const [{ adminCount }] = await tx
              .select({ adminCount: count() })
              .from(user)
              .where(
                and(
                  eq(user.role, "admin"),
                  not(eq(user.banned, true)),
                  not(eq(user.id, userId)),
                ),
              );
            if (adminCount === 0) throw new Error("LastAdmin");

            const targetEmail = email ?? null;
            await auth.api.removeUser({
              headers: reqHeaders,
              body: { userId },
            });
            writeAudit({
              userId: session.user.id,
              userEmail: session.user.email,
              action: "user.delete",
              entityType: "user",
              entityId: userId,
              metadata: { email: targetEmail },
              ipAddress: getIp(request),
            }).catch(console.error);
          },
          { behavior: "immediate" },
        );
        break;
      }

      case "updateName": {
        const trimmedName = typeof body.name === "string" ? body.name.trim() : "";
        if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
          return NextResponse.json({ error: "Geçersiz isim" }, { status: 400 });
        }
        // Self OR admin can update name
        if (userId !== session.user.id && session.user.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        await db
          .update(user)
          .set({ name: trimmedName, updatedAt: sql`(strftime('%s','now'))` })
          .where(eq(user.id, userId));
        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.name_update",
          entityType: "user",
          entityId: userId,
          metadata: { name: trimmedName },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "create": {
        const name = email ? email.split("@")[0] : "user";
        const password = randomBytes(24).toString("base64url");
        const newUser = await auth.api.createUser({
          headers: reqHeaders,
          body: { email, name, password, role: role ?? "user" },
        });
        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.create",
          entityType: "user",
          entityId: (newUser as { user?: { id?: string } })?.user?.id ?? userId,
          metadata: { email, role: role ?? "user" },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "invite": {
        if (!email) {
          return NextResponse.json({ error: "Email gerekli" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit: 3/day per recipient email
        const rlResult = checkRateLimit(`invite:email:${normalizedEmail}`, {
          limit: 3,
          windowSeconds: 86400,
        });
        if (!rlResult.success) {
          return NextResponse.json(
            { error: "Bu adrese çok fazla davet gönderildi. Lütfen yarın tekrar deneyin." },
            { status: 429 },
          );
        }

        // Check if user already exists (enumeration-safe message)
        const [existingUser] = await db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.email, normalizedEmail))
          .limit(1);

        if (existingUser) {
          return NextResponse.json(
            { error: "Bu email adresiyle ilgili bir işlem gerçekleştirilemedi." },
            { status: 409 },
          );
        }

        // Cancel any existing pending invite for this email
        await db
          .update(userInvites)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(userInvites.email, normalizedEmail),
              isNull(userInvites.usedAt),
            ),
          );

        // Generate token
        const rawToken = randomBytes(32).toString("base64url");
        const tokenHash = createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

        await db.insert(userInvites).values({
          id: crypto.randomUUID(),
          email: normalizedEmail,
          tokenHash,
          role: role ?? "user",
          invitedBy: session.user.id,
          expiresAt,
          createdAt: new Date(),
        });

        // Send invite email
        const inviteUrl = `${env.BETTER_AUTH_URL}/auth/accept-invite?token=${rawToken}`;
        await resend.emails.send({
          from: env.RESEND_FROM_EMAIL,
          to: normalizedEmail,
          subject: "CMS'e davet edildiniz",
          text: `Merhaba,\n\nSizi CMS'e davet ettik. Aşağıdaki bağlantıya tıklayarak hesabınızı oluşturabilirsiniz:\n\n${inviteUrl}\n\nBu bağlantı 72 saat geçerlidir.\n\nEğer bu daveti siz talep etmediyseniz, bu emaili görmezden gelebilirsiniz.`,
        });

        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.invite",
          entityType: "user",
          metadata: { email: normalizedEmail, role: role ?? "user" },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "LastAdmin") {
      return NextResponse.json(
        { error: "Son admin silinemez veya banlanamaz. Önce başka bir kullanıcıyı admin yapın." },
        { status: 400 },
      );
    }
    return handleApiError(error, "Failed to perform user action");
  }
}
