import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, count, eq, isNull, not, sql } from "drizzle-orm";
import { z } from "zod";
import { Resend } from "resend";

import { db } from "@/statix/lib/db";
import { handleApiError } from "@/statix/lib/api-response";
import {
  user,
  userInvites,
  session as sessionTable,
  account,
} from "@/statix/db/schema";
import { writeAudit, getIp } from "@/statix/lib/audit";
import { requirePermission, isOwner, getUserPermissions } from "@/statix/lib/session";
import {
  hasGlobalPermission,
  P,
  GLOBAL_PERMISSION_KEYS,
  COLLECTION_PERMISSION_KEYS,
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type RolePermissions,
} from "@/statix/types/permissions";
import { statixConfig } from "@/statix.config";
import { checkRateLimit } from "@/statix/lib/rate-limit";
import { env } from "@/statix/lib/env";

export const runtime = "nodejs";

// Resend is optional. If unset, invite links are logged to the server
// console so a developer can still test the invite flow without
// configuring an email provider first.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const banSchema = z.object({
  reason: z.string().max(500).optional(),
  expiresAt: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), { message: "expiresAt must be in the future" })
    .optional(),
});

/** Derive legacy role string from permissions object */
function deriveRoleLabel(perms: RolePermissions): string {
  const adminPreset = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN];
  const editorPreset = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.EDITOR];
  const collSlugs = statixConfig.collections.map((c) => c.slug);

  // Full match: global + collection permissions
  const matchesFull = (preset: RolePermissions) => {
    // Check globals
    for (const key of GLOBAL_PERMISSION_KEYS) {
      if (!!perms[key] !== !!preset[key]) return false;
    }
    // Check collections
    const wildcard = preset.collections?.["*"];
    for (const slug of collSlugs) {
      const cur = perms.collections?.[slug] ?? perms.collections?.["*"];
      const pre = preset.collections?.[slug] ?? wildcard;
      if (!cur && !pre) continue;
      if (!cur || !pre) return false;
      for (const k of COLLECTION_PERMISSION_KEYS) {
        if (!!cur[k] !== !!pre[k]) return false;
      }
    }
    return true;
  };

  if (matchesFull(adminPreset)) return "admin";
  if (matchesFull(editorPreset)) return "editor";

  // Check config-defined role presets
  for (const role of statixConfig.roles ?? []) {
    if (matchesFull(role.permissions)) {
      return role.name.toLowerCase().replace(/\s+/g, "-");
    }
  }

  return "custom";
}

export async function GET() {
  try {
    await requirePermission(P.MANAGE_USERS);

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        image: user.image,
        createdAt: user.createdAt,
        permissions: user.permissions,
      })
      .from(user)
      .limit(100);

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error, "Failed to list users");
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requirePermission(P.MANAGE_USERS);
    const body = await request.json();
    const { action, userId, email, role, banReason, banExpiresAt } = body;


    // Self-mutation guard — block destructive ops on own account, allow profile updates
    const selfAllowed = ["create", "invite", "updateName", "updateAvatar"];

    if (!selfAllowed.includes(action) && userId && userId === session.user.id) {
      return NextResponse.json(
        { error: "Kendi hesabınıza bu işlemi yapamazsınız" },
        { status: 400 },
      );
    }

    switch (action) {
      case "ban": {
        // Owner protection
        if (await isOwner(userId)) {
          return NextResponse.json(
            { error: "Owner kullanıcısı banlanamaz." },
            { status: 403 },
          );
        }

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

            await tx
              .update(user)
              .set({
                banned: true,
                banReason: banParsed.data.reason ?? null,
                banExpires: banParsed.data.expiresAt ? new Date(banParsed.data.expiresAt) : null,
                updatedAt: new Date(),
              })
              .where(eq(user.id, userId));
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
        await db
          .update(user)
          .set({ banned: false, banReason: null, banExpires: null, updatedAt: new Date() })
          .where(eq(user.id, userId));
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
        // Owner protection
        if (await isOwner(userId)) {
          return NextResponse.json(
            { error: "Owner kullanıcısı silinemez." },
            { status: 403 },
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

            const targetEmail = email ?? null;
            await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
            await tx.delete(account).where(eq(account.userId, userId));
            await tx.delete(user).where(eq(user.id, userId));
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
        // Self OR user with canManageUsers permission can update name
        if (userId !== session.user.id) {
          const permissions = await getUserPermissions(session.user.id);
          if (!hasGlobalPermission(permissions, P.MANAGE_USERS)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
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
        const newId = crypto.randomUUID();
        const roleLabel = role ?? "editor";
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[
          roleLabel === "admin" ? SYSTEM_ROLES.ADMIN : SYSTEM_ROLES.EDITOR
        ];

        await db.insert(user).values({
          id: newId,
          email,
          name,
          emailVerified: false,
          role: roleLabel,
          permissions: JSON.stringify(defaultPerms),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.create",
          entityType: "user",
          entityId: newId,
          metadata: { email, role: roleLabel },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "invite": {
        if (!email) {
          return NextResponse.json({ error: "Email gerekli" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Rate limit: 50/day per sender. Caps an admin (or a compromised
        // admin account) blasting invites to drain the email provider's
        // quota or spam unwilling recipients. Checked first so the
        // expensive DB lookups below are skipped when the limit hits.
        const senderRl = checkRateLimit(`invite:sender:${session.user.id}`, {
          limit: 50,
          windowSeconds: 86400,
        });
        if (!senderRl.success) {
          return NextResponse.json(
            {
              error:
                "You have sent too many invites today. Please try again tomorrow.",
            },
            { status: 429 },
          );
        }

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
          role: role ?? "editor",
          invitedBy: session.user.id,
          expiresAt,
          createdAt: new Date(),
        });

        // Send invite email (or log it in dev when Resend isn't configured)
        const inviteUrl = `${env.BETTER_AUTH_URL}/auth/accept-invite?token=${rawToken}`;
        if (!resend || !env.RESEND_FROM_EMAIL) {
          // eslint-disable-next-line no-console
          console.log(
            `\n[statix] Resend not configured — invite link for ${normalizedEmail}:\n${inviteUrl}\n` +
              `         Set RESEND_API_KEY + RESEND_FROM_EMAIL in .env to send real emails.\n`,
          );
        } else {
          await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: normalizedEmail,
            subject: "CMS'e davet edildiniz",
            text: `Merhaba,\n\nSizi CMS'e davet ettik. Aşağıdaki bağlantıya tıklayarak hesabınızı oluşturabilirsiniz:\n\n${inviteUrl}\n\nBu bağlantı 72 saat geçerlidir.\n\nEğer bu daveti siz talep etmediyseniz, bu emaili görmezden gelebilirsiniz.`,
          });
        }

        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.invite",
          entityType: "user",
          metadata: { email: normalizedEmail, role: role ?? "editor" },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "setPermissions": {
        // Owner protection
        if (await isOwner(userId)) {
          return NextResponse.json(
            { error: "Owner kullanıcısının izinleri değiştirilemez." },
            { status: 403 },
          );
        }

        const perms = body.permissions as RolePermissions;
        if (!perms || typeof perms !== "object") {
          return NextResponse.json({ error: "Invalid permissions" }, { status: 400 });
        }

        // Derive legacy role label from permissions
        const roleLabel = deriveRoleLabel(perms);

        await db
          .update(user)
          .set({
            permissions: JSON.stringify(perms),
            role: roleLabel,
            updatedAt: new Date(),
          })
          .where(eq(user.id, userId));

        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "user.permissions_change",
          entityType: "user",
          entityId: userId,
          metadata: { permissions: perms, role: roleLabel },
          ipAddress: getIp(request),
        }).catch(console.error);
        break;
      }

      case "transferOwnership": {
        // Only owner can transfer
        if (!(await isOwner(session.user.id))) {
          return NextResponse.json(
            { error: "Sadece owner sahipliği devredebilir" },
            { status: 403 },
          );
        }

        if (!userId) {
          return NextResponse.json({ error: "userId zorunludur" }, { status: 400 });
        }

        if (userId === session.user.id) {
          return NextResponse.json(
            { error: "Sahipliği kendinize devredemezsiniz" },
            { status: 400 },
          );
        }

        const ownerPerms = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.OWNER];
        const adminPerms = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN];

        await db.transaction(
          async (tx) => {
            // Set target user to owner
            await tx
              .update(user)
              .set({
                role: SYSTEM_ROLES.OWNER,
                permissions: JSON.stringify(ownerPerms),
                updatedAt: new Date(),
              })
              .where(eq(user.id, userId));

            // Demote current user to admin
            await tx
              .update(user)
              .set({
                role: SYSTEM_ROLES.ADMIN,
                permissions: JSON.stringify(adminPerms),
                updatedAt: new Date(),
              })
              .where(eq(user.id, session.user.id));
          },
          { behavior: "immediate" },
        );

        writeAudit({
          userId: session.user.id,
          userEmail: session.user.email,
          action: "role.ownership_transferred",
          entityType: "user",
          entityId: userId,
          metadata: { fromUserId: session.user.id, toUserId: userId },
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
