import { NextRequest, NextResponse } from "next/server";

import { getGitHubCMS } from "@/lib/github-cms";
import { extractR2Key, getPublicUrl, moveR2 } from "@/lib/r2";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const updatedFiles = await github.updateMediaReferences(oldUrl, newUrl);

    return NextResponse.json({
      success: true,
      newUrl,
      updatedFiles: updatedFiles.updatedFiles.length,
    });
  } catch (error) {
    console.error("Move error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to move file: ${errorMessage}` },
      { status: 500 },
    );
  }
}
