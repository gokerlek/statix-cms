import { NextResponse } from "next/server";

import { handleApiError } from "@/statix/lib/api-response";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import { listR2Trash } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

export async function GET() {
  try {
    await requirePermission(P.MANAGE_TRASH);

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
    return handleApiError(error, "Failed to fetch trash items");
  }
}
