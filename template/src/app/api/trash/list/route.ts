import { NextResponse } from "next/server";

import { getGitHubCMS } from "@/lib/github-cms";
import { listR2Trash } from "@/lib/r2";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const github = getGitHubCMS();

    // Content trash (GitHub JSON) + Medya trash (R2) — ikisini birleştir
    const [contentItems, r2Items] = await Promise.all([
      github.getTrashItems().catch(() => []),
      listR2Trash().catch(() => []),
    ]);

    // R2 alanlarını TrashItem şekline dönüştür
    const mediaItems = r2Items.map((item) => ({
      name: item.originalKey.split("/").pop() ?? item.originalKey,
      path: item.trashKey,
      originalPath: item.originalKey,
      deletedAt: item.deletedAt ?? new Date(0).toISOString(),
      type: "media" as const,
    }));

    const allItems = [...contentItems, ...mediaItems];

    return NextResponse.json(allItems);
  } catch (error) {
    console.error("Trash list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trash items" },
      { status: 500 },
    );
  }
}
