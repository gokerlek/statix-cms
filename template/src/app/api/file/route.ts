import { NextRequest, NextResponse } from "next/server";

import { fileDeleteSchema } from "@/lib/api-schemas";
import { getMaxUploadSize, validateFileUpload } from "@/lib/file-validation";
import { deleteFromR2, uploadToR2 } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";
import { formatFileSize } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

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
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;
    const key = `files/${filename}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToR2(buffer, key, file.type);

    return NextResponse.json({ url, key, filename, size: file.size, type: file.type });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 },
      );
    }
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

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
    if (
      error instanceof Error &&
      (error.message === "Unauthorized" || error.message === "Forbidden")
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === "Unauthorized" ? 401 : 403 },
      );
    }
    console.error("File delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
