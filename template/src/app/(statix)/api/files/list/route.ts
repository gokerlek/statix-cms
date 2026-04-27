import { type NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/statix/lib/api-response";
import {
  getContentIndex,
  isFileOrphaned,
} from "@/statix/lib/content-index";
import { listR2Media } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

/**
 * List uploaded files under the `files/` R2 prefix. Mirror of
 * `/api/media/list` for File-field uploads.
 *
 * Each row carries an `isOrphaned` flag computed against the shared
 * content index so the library UI can render status-based tabs / badges
 * without a second round-trip. Falls back to `false` when the content
 * index can't be built (e.g. GitHub outage) — that way we never
 * incorrectly mark live files as orphaned on transient failures.
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(P.MANAGE_FILES);

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const [{ items: files, nextCursor }, { index: contentIndex, ok: indexOk }] =
      await Promise.all([
        listR2Media("files/", { cursor, limit }),
        getContentIndex(),
      ]);

    const items = files
      .filter((file) => !file.key.endsWith("/"))
      .map((file) => ({
        name: file.key.split("/").pop() ?? file.key,
        key: file.key,
        url: file.url,
        size: file.size,
        lastModified: file.lastModified,
        isOrphaned: indexOk ? isFileOrphaned(contentIndex, file.key) : false,
      }));

    return NextResponse.json({ items, nextCursor: nextCursor ?? null });
  } catch (error) {
    return handleApiError(error, "Failed to list files");
  }
}
