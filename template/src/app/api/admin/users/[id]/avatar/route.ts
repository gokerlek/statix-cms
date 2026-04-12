import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { user } from "@/db/schema";
import { requireSelfOrAdmin } from "@/lib/session";
import { uploadToR2, deleteFromR2, extractR2Key } from "@/lib/r2";
import { writeAudit, getIp } from "@/lib/audit";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

function validateMagicBytes(buffer: Buffer, contentType: string): boolean {
  // JPEG: FF D8 FF
  if (contentType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  // PNG: 89 50 4E 47
  if (contentType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  // WebP: RIFF????WEBP
  if (contentType === "image/webp") {
    return (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    );
  }
  return false;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireSelfOrAdmin(id);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
    }

    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: "Sadece JPEG, PNG ve WebP dosyaları kabul edilir" },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 2 MB'ı geçemez" },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "Geçersiz dosya formatı" },
        { status: 400 },
      );
    }

    // Fetch existing avatar key for cleanup
    const [existing] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 },
      );
    }

    // Upload to R2: avatars/{userId}/avatar-{uuid}.{ext}
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const key = `avatars/${id}/avatar-${crypto.randomUUID()}.${ext}`;
    const url = await uploadToR2(buffer, key, file.type);

    // Update DB
    await db
      .update(user)
      .set({ image: url, updatedAt: new Date() })
      .where(eq(user.id, id));

    // Cleanup old avatar from R2 (fire-and-forget)
    if (existing.image) {
      const oldKey = extractR2Key(existing.image);
      if (oldKey?.startsWith("avatars/")) {
        deleteFromR2(oldKey).catch(console.error);
      }
    }

    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "user.avatar_update",
      entityType: "user",
      entityId: id,
      ipAddress: getIp(request),
    }).catch(console.error);

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error, "Yükleme başarısız");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await requireSelfOrAdmin(id);

    const [existing] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 404 },
      );
    }

    // Remove from R2 (fire-and-forget)
    if (existing.image) {
      const oldKey = extractR2Key(existing.image);
      if (oldKey?.startsWith("avatars/")) {
        deleteFromR2(oldKey).catch(console.error);
      }
    }

    // Clear DB
    await db
      .update(user)
      .set({ image: null, updatedAt: new Date() })
      .where(eq(user.id, id));

    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "user.avatar_remove",
      entityType: "user",
      entityId: id,
      ipAddress: getIp(request),
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Silme başarısız");
  }
}
