import { NextRequest, NextResponse } from "next/server";

import {
  sanitizeFilename,
  sanitizeFolder,
  validateFileUpload,
} from "@/statix/lib/file-validation";
import { handleApiError } from "@/statix/lib/api-response";
import { writeAudit, getIp } from "@/statix/lib/audit";
import { uploadToR2 } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

export async function POST(request: NextRequest) {
  try {
    const { session } = await requirePermission(P.MANAGE_MEDIA);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderRaw = formData.get("folder");
    const filename = formData.get("filename") as string;

    // Unified folder validator — same shape as /api/file. Bad values
    // return null so we silently fall back to the bucket root rather
    // than failing the upload.
    const folder = sanitizeFolder(
      typeof folderRaw === "string" ? folderRaw : null,
    );

    const validation = validateFileUpload(file);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const rawFilename = filename || file.name;
    let safeFilename = sanitizeFilename(rawFilename);

    // Uzantı yoksa mime type'dan ekle
    if (!safeFilename.includes(".")) {
      const mimeToExt: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/avif": ".avif",
      };
      const ext = mimeToExt[file.type] ?? "";
      safeFilename = safeFilename + ext;
    }

    const key = folder
      ? `uploads/${folder}/${safeFilename}`
      : `uploads/${safeFilename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, key, file.type);

    await writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "media.upload",
      entityType: "media",
      entityId: key,
      metadata: { size: file.size, folder: folder ?? "default", contentType: file.type },
      ipAddress: getIp(request),
    });

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error, "Failed to upload file");
  }
}
