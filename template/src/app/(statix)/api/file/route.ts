import { NextRequest, NextResponse } from "next/server";

import { fileDeleteSchema } from "@/statix/lib/api-schemas";
import { handleApiError } from "@/statix/lib/api-response";
import { writeAudit, getIp } from "@/statix/lib/audit";
import {
  getMaxUploadSize,
  sanitizeFilename,
  sanitizeFolder,
  validateFileUpload,
} from "@/statix/lib/file-validation";
import { softDeleteR2, uploadToR2 } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { formatFileSize } from "@/statix/lib/utils";
import { P } from "@/statix/types/permissions";

export async function POST(request: NextRequest) {
  try {
    await requirePermission(P.MANAGE_FILES);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderRaw = formData.get("folder");
    const filenameOverride = formData.get("filename");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = getMaxUploadSize();

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum ${formatFileSize(maxSize)} allowed.` },
        { status: 400 },
      );
    }

    // `kind: "file"` widens the MIME allow list to documents + archives.
    // `/api/upload` (images only) stays on the default `"image"` kind.
    const validation = validateFileUpload(file, "file");
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const folder = sanitizeFolder(
      typeof folderRaw === "string" ? folderRaw : null,
    );

    // Optional filename override (user-typed). Keep the original
    // extension; sanitize for R2 safety.
    const sourceName =
      typeof filenameOverride === "string" && filenameOverride.trim()
        ? appendExt(filenameOverride.trim(), file.name)
        : file.name;

    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(sourceName);
    const filename = `${timestamp}-${sanitizedName}`;
    const key = folder
      ? `files/${folder}/${filename}`
      : `files/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, key, file.type);

    return NextResponse.json({ url, key, filename, size: file.size, type: file.type });
  } catch (error) {
    return handleApiError(error, "Failed to upload file");
  }
}

/** Reattach the original extension if the user-supplied name lacks one. */
function appendExt(name: string, originalFilename: string): string {
  const dot = originalFilename.lastIndexOf(".");
  const ext = dot > 0 ? originalFilename.slice(dot) : "";
  return name.endsWith(ext) ? name : `${name}${ext}`;
}

export async function DELETE(request: NextRequest) {
  try {
    const { session } = await requirePermission(P.MANAGE_FILES);

    const body = await request.json();
    const parsed = fileDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { key } = parsed.data;

    // Soft delete — moves the object to `trash/files/...` so the user
    // can restore it from the Trash page (mirrors `/api/media/delete`).
    // Permanent removal still flows through `/api/trash/delete` after
    // the user confirms in the trash UI.
    const trashKey = await softDeleteR2(key);

    await writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "file.soft_delete",
      entityType: "file",
      entityId: key,
      metadata: { trashKey },
      ipAddress: getIp(request),
    });

    return NextResponse.json({ success: true, trashKey });
  } catch (error) {
    return handleApiError(error, "Failed to delete file");
  }
}
