import { NextRequest, NextResponse } from "next/server";

import { writeAudit, getIp, cleanupOldAuditLogs } from "@/lib/audit";
import { getGitHubCMS } from "@/lib/github-cms";
import { deleteFromR2 } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await request.json();
    const { items } = body; // [{ type: "content" | "media", path: string }]

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const github = getGitHubCMS();

    for (const item of items) {
      if (item.type === "media") {
        await deleteFromR2(item.path);
      } else {
        await github.deleteTrashItem(item.path);
      }
      await writeAudit({
        userId: session.user.id,
        userEmail: session.user.email,
        action: item.type === "media" ? "media.permanent_delete" : "content.permanent_delete",
        entityType: item.type,
        entityId: item.path,
        ipAddress: getIp(request),
      });
    }

    // 90 günden eski audit logları temizle (fire-and-forget)
    cleanupOldAuditLogs().catch((e) => console.error("[audit cleanup]", e));

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
    console.error("Trash delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete items" },
      { status: 500 },
    );
  }
}
