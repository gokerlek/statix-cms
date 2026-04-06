import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { ROUTES } from "@/lib/constants";
import { getGitHubCMS } from "@/lib/github-cms";
import { restoreR2 } from "@/lib/r2";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
        await restoreR2(item.path);
      } else {
        // type === "content" — GitHub'dan restore
        await github.restoreTrashItem(item.path);
      }
    }

    revalidatePath(ROUTES.ADMIN.ROOT, "layout");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { error: "Failed to restore items" },
      { status: 500 },
    );
  }
}
