import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { sanitizeFilename, validateFileUpload } from "@/lib/file-validation";
import { getGitHubCMS } from "@/lib/github-cms";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;
    const filename = formData.get("filename") as string;

    // Validate file upload
    const validation = validateFileUpload(file);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Sanitize filename
    const safeFilename = filename ? sanitizeFilename(filename) : undefined;

    console.log(
      `Upload request: file=${file?.name}, folder=${folder || "default"}, filename=${safeFilename}`,
    );

    const github = getGitHubCMS();

    // Pass folder and sanitized filename to uploadImage
    const url = await github.uploadImage(file, folder, safeFilename);

    console.log(`Upload completed successfully: ${url}`);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
