import { createHash } from "node:crypto";
import Image from "next/image";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/statix/lib/db";
import { userInvites, user } from "@/statix/db/schema";
import { auth } from "@/statix/lib/auth";
import { writeAudit } from "@/statix/lib/audit";
import { checkRateLimit } from "@/statix/lib/rate-limit";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const runtime = "nodejs";

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidInvite message="Geçersiz davet bağlantısı." />;
  }

  // Find invite by token hash
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const [invite] = await db
    .select()
    .from(userInvites)
    .where(
      and(
        eq(userInvites.tokenHash, tokenHash),
        isNull(userInvites.usedAt),
      ),
    )
    .limit(1);

  if (!invite) {
    return <InvalidInvite message="Bu davet bağlantısı geçersiz veya daha önce kullanılmış." />;
  }

  if (invite.expiresAt < new Date()) {
    return <InvalidInvite message="Bu davet bağlantısının süresi dolmuş. Yeni bir davet talep edin." />;
  }

  // Server Action: consume invite + create user + send OTP
  async function acceptInvite(formData: FormData) {
    "use server";

    const email = (formData.get("email") as string | null)?.trim();
    if (!email) {
      redirect(`/auth/accept-invite?token=${token}&error=invalid`);
    }

    // IP-based rate limit: 20/hour against brute-force
    const reqHeaders = await headers();
    const ip =
      reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ??
      reqHeaders.get("x-real-ip") ??
      "unknown";

    const rl = checkRateLimit(`accept-invite:ip:${ip}`, {
      limit: 20,
      windowSeconds: 3600,
    });
    if (!rl.success) {
      redirect(`/auth/accept-invite?token=${token}&error=ratelimit`);
    }

    // Re-validate invite atomically (in case of concurrent request)
    const [freshInvite] = await db
      .select()
      .from(userInvites)
      .where(
        and(
          eq(userInvites.tokenHash, tokenHash),
          isNull(userInvites.usedAt),
        ),
      )
      .limit(1);

    if (!freshInvite || freshInvite.expiresAt < new Date()) {
      redirect(`/auth/accept-invite?token=${token}&error=expired`);
    }

    // Mark as used
    await db
      .update(userInvites)
      .set({ usedAt: new Date() })
      .where(eq(userInvites.tokenHash, tokenHash));

    // Create user — name defaults to email prefix; can be updated from the drawer later
    const defaultName = freshInvite.email.split("@")[0];
    const newUserId = crypto.randomUUID();
    // Set default permissions based on invited role
    const { SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS } = await import("@/statix/types/permissions");
    const roleLabel = freshInvite.role === "admin" ? SYSTEM_ROLES.ADMIN : SYSTEM_ROLES.EDITOR;
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[roleLabel];
    await db.insert(user).values({
      id: newUserId,
      email: freshInvite.email,
      name: defaultName,
      emailVerified: true,
      role: freshInvite.role, // legacy label
      permissions: JSON.stringify(defaultPerms),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send OTP for immediate sign-in
    await auth.api.sendVerificationOTP({
      headers: reqHeaders,
      body: {
        email: freshInvite.email,
        type: "sign-in",
      },
    });

    // Audit
    writeAudit({
      action: "user.invite_accepted",
      entityType: "user",
      metadata: { email: freshInvite.email, role: freshInvite.role },
    }).catch(console.error);

    redirect(
      `/auth/signin?invited=1&email=${encodeURIComponent(freshInvite.email)}`,
    );
  }

  // Determine error message from query param
  const { error } = await searchParams;
  const errorMessage =
    error === "invalid"
      ? "Geçersiz davet verisi."
      : error === "ratelimit"
        ? "Çok fazla deneme yaptınız. Lütfen bekleyin."
        : error === "expired"
          ? "Bu davet bağlantısının süresi dolmuş."
          : undefined;

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-primary to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex flex-col items-center gap-5 mb-8">
            <Image src="/logo-label.svg" alt="Logo" width={136} height={33} priority />
            <div className="text-center">
              <h1 className="text-xl font-semibold text-white">CMS'e Davet Edildiniz</h1>
              <p className="text-sm text-primary-foreground/70 mt-1">
                Daveti kabul ederek hesabınızı oluşturun
              </p>
            </div>
          </div>

          <AcceptInviteForm
            email={invite.email}
            action={acceptInvite}
            error={errorMessage}
          />
        </div>
      </div>
    </div>
  );
}

function InvalidInvite({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-primary to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
          <Image
            src="/logo-label.svg"
            alt="Logo"
            width={136}
            height={33}
            priority
            className="mx-auto mb-6"
          />
          <p className="text-white/90 text-sm">{message}</p>
          <a
            href="/auth/signin"
            className="inline-block mt-4 text-sm text-primary-foreground/60 hover:text-primary-foreground underline"
          >
            Giriş sayfasına dön
          </a>
        </div>
      </div>
    </div>
  );
}
