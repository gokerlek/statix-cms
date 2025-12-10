import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getGitHubCMS } from "@/lib/github-cms";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { path, sha } = body;

    if (!path || !sha) {
      return NextResponse.json(
        { error: "Path and SHA are required" },
        { status: 400 },
      );
    }

    const github = getGitHubCMS();

    await github.softDeleteMedia(path, sha);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to delete file: ${errorMessage}` },
      { status: 500 },
    );
  }
}
