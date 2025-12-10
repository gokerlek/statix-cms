import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { ROUTES } from "@/lib/constants";
import { getGitHubCMS } from "@/lib/github-cms";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { paths } = body;

    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const github = getGitHubCMS();

    // Process sequentially to avoid race conditions or rate limits
    for (const path of paths) {
      await github.restoreTrashItem(path);
    }

    // Revalidate everything since we don't know exactly what was restored where
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
