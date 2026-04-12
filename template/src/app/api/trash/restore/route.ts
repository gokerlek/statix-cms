import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { trashActionSchema } from "@/lib/api-schemas";
import { handleApiError } from "@/lib/api-response";
import { writeAudit, getIp } from "@/lib/audit";
import { ROUTES } from "@/lib/constants";
import { getGitHubCMS } from "@/lib/github-cms";
import { restoreR2 } from "@/lib/r2";
import { requireAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

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
