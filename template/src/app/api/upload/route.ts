import { NextRequest, NextResponse } from "next/server";

import { sanitizeFilename, validateFileUpload } from "@/lib/file-validation";
import { handleApiError } from "@/lib/api-response";
import { writeAudit, getIp } from "@/lib/audit";
import { uploadToR2 } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

// Only alphanumeric, hyphens, underscores — no path separators
const VALID_FOLDER = /^[a-zA-Z0-9_-]+$/;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string | null;
    const filename = formData.get("filename") as string;

    // Validate folder name to prevent path traversal
    if (folder && !VALID_FOLDER.test(folder)) {
      return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
    }

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
