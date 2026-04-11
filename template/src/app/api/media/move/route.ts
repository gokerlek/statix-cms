import { NextRequest, NextResponse } from "next/server";

import { writeAudit, getIp } from "@/lib/audit";
import { getGitHubCMS } from "@/lib/github-cms";
import { extractR2Key, getPublicUrl, moveR2 } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const { currentUrl, currentPath, newFolder } = body;

    if ((!currentUrl && !currentPath) || !newFolder) {
      return NextResponse.json(
        { error: "currentUrl or currentPath, and newFolder are required" },
        { status: 400 },
      );
    }

    // currentPath doğrudan R2 key, currentUrl'den key çıkar
    const sourceKey = currentPath ?? extractR2Key(currentUrl);
    if (!sourceKey) {
      return NextResponse.json(
        { error: "Invalid media URL or path" },
        { status: 400 },
      );
    }

    // sourceKey sadece uploads/ veya avatars/ olabilir
    if (
      (!sourceKey.startsWith("uploads/") &&
        !sourceKey.startsWith("avatars/")) ||
      sourceKey.includes("..") ||
      sourceKey.includes("//")
    ) {
      return NextResponse.json(
        { error: "Invalid source path" },
        { status: 400 },
      );
    }

    // newFolder sadece alfanümerik + dash/underscore (path traversal imkansız)
    if (
      newFolder &&
      newFolder !== "default" &&
      !/^[a-zA-Z0-9_-]+$/.test(newFolder)
    ) {
      return NextResponse.json(
        { error: "Invalid folder name" },
        { status: 400 },
      );
    }

    const filename = sourceKey.split("/").pop()!;
    const targetKey =
      !newFolder || newFolder === "default"
        ? `uploads/${filename}`
        : `uploads/${newFolder}/${filename}`;

    // R2'de taşı
    const oldUrl = currentUrl ?? getPublicUrl(sourceKey);
    const newUrl = await moveR2(sourceKey, targetKey);

    // GitHub content JSON'larında URL referanslarını güncelle
    const github = getGitHubCMS();
    const updatedFiles = await github.updateMediaReferences(oldUrl, newUrl, session.user);

    await writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "media.move",
      entityType: "media",
      entityId: targetKey,
      metadata: { fromKey: sourceKey, toKey: targetKey },
      ipAddress: getIp(request),
    });

    return NextResponse.json({
      success: true,
      newUrl,
      updatedFiles: updatedFiles.updatedFiles.length,
    });
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
    console.error("Move error:", error);
    return NextResponse.json(
      { error: "Failed to move file" },
      { status: 500 },
    );
  }
}
