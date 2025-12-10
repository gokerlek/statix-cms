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
    const { currentPath, newFolder } = body;

    if (!currentPath || !newFolder) {
      return NextResponse.json(
        { error: "currentPath and newFolder are required" },
        { status: 400 },
      );
    }

    const github = getGitHubCMS();
    const result = await github.moveMedia(currentPath, newFolder);

    return NextResponse.json({
      success: true,
      updatedFiles: result.updatedFiles.length,
      updatedFileList: result.updatedFiles,
    });
  } catch (error) {
    console.error("Move error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to move file: ${errorMessage}` },
      { status: 500 },
    );
  }
}
