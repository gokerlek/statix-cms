import { type NextRequest, NextResponse } from "next/server";

import { getContentIndex, isMediaOrphaned } from "@/statix/lib/content-index";
import { handleApiError } from "@/statix/lib/api-response";
import { listR2Media } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(P.MANAGE_MEDIA);

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const [{ items: files, nextCursor }, { index: contentIndex, ok: contentFetched }] = await Promise.all([
      listR2Media("uploads/", { cursor, limit }),
      getContentIndex(),
    ]);

    const filtered = files.filter(
      (file) =>
        !file.key.startsWith("uploads/uploads/") && !file.key.endsWith("/"),
    );

    const items = filtered.map((file) => ({
      name: file.key.split("/").pop() ?? file.key,
      path: file.key,
      url: file.url,
      size: file.size,
      lastModified: file.lastModified,
      isOrphaned: contentFetched ? isMediaOrphaned(contentIndex, file.key.split("/").pop() ?? "") : false,
    }));

    return NextResponse.json({ items, nextCursor: nextCursor ?? null });
  } catch (error) {
    return handleApiError(error, "Failed to list media");
  }
}
