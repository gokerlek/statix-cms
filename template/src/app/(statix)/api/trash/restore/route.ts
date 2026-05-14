import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { trashActionSchema } from "@/statix/lib/api-schemas";
import { handleApiError } from "@/statix/lib/api-response";
import { writeAudit, getIp } from "@/statix/lib/audit";
import { ROUTES } from "@/statix/lib/constants";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import { restoreR2 } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

export async function POST(request: NextRequest) {
  try {
    const { session } = await requirePermission(P.MANAGE_TRASH);

    const body = await request.json();
    const parsed = trashActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { items } = parsed.data;

    const github = getGitHubCMS();

    for (const item of items) {
      if (item.type === "media") {
        await restoreR2(item.path);
      } else {
        // type === "content" — GitHub'dan restore
        await github.restoreTrashItem(item.path, session.user);
      }
      await writeAudit({
        userId: session.user.id,
        userEmail: session.user.email,
        action: item.type === "media" ? "media.restore" : "content.restore",
        entityType: item.type,
        entityId: item.path,
        ipAddress: getIp(request),
      });
    }

    revalidatePath(ROUTES.ADMIN.ROOT, "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to restore items");
  }
}
