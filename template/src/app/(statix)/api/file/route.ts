import { NextRequest, NextResponse } from "next/server";

import { fileDeleteSchema } from "@/statix/lib/api-schemas";
import { handleApiError } from "@/statix/lib/api-response";
import { getMaxUploadSize, sanitizeFilename, validateFileUpload } from "@/statix/lib/file-validation";
import { deleteFromR2, uploadToR2 } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { formatFileSize } from "@/statix/lib/utils";
import { P } from "@/statix/types/permissions";

export async function POST(request: NextRequest) {
  try {
    await requirePermission(P.MANAGE_MEDIA);

    const formData = await request.formData();
    const file = formData.get("file") as File;

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

    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(file.name);
    const filename = `${timestamp}-${sanitizedName}`;
    const key = `files/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, key, file.type);

    return NextResponse.json({ url, key, filename, size: file.size, type: file.type });
  } catch (error) {
    return handleApiError(error, "Failed to upload file");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission(P.MANAGE_MEDIA);

    const body = await request.json();
    const parsed = fileDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { key } = parsed.data;

    await deleteFromR2(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete file");
  }
}
