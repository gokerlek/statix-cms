import { NextResponse } from "next/server";

import { getFileStats } from "@/statix/lib/dashboard-data";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

/**
 * Mirror of `/api/media/stats` for the `files/` R2 prefix. Returns total
 * count, size, per-extension distribution, orphaned count, and the last
 * 6 uploads with live/orphaned status — exactly the shape `FilesOverview`
 * renders.
 */
export async function GET() {
  try {
    await requirePermission(P.MANAGE_FILES);

    const stats = await getFileStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch file stats:", error);

    return NextResponse.json(
      { error: "Failed to fetch file stats" },
      { status: 500 },
    );
  }
}
