import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
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

    for (const path of paths) {
      await github.deleteTrashItem(path);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Trash delete error:", error);

    return NextResponse.json(
      { error: "Failed to delete items" },
      { status: 500 },
    );
  }
}
