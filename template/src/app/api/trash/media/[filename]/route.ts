import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getGitHubCMS } from "@/lib/github-cms";

interface RouteContext {
  params: Promise<{ filename: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await context.params;
    const github = getGitHubCMS();

    // Construct path to trash media
    // Note: We don't have the extension in the param if we use [filename],
    // but usually filename includes extension.
    // However, next.js dynamic routes might split it if we used [...path].
    // Here we use [filename], so it should catch "image.png".

    const path = `content/trash/media/${filename}`;

    try {
      // We need to get the raw content.
      // getFile returns parsed JSON for .json files, but for others it tries to parse or returns base64?
      // github-cms.ts getFile:
      // if type === "file", it decodes base64 to utf-8 and JSON.parse.
      // This is BAD for images.
      // We should use octokit directly here or add a getRawFile method.

      const response = await github.octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER || "",
        repo: process.env.GITHUB_REPO || "",
        path,
        ref: process.env.GITHUB_BRANCH || "main",
      });

      if ("content" in response.data && response.data.type === "file") {
        const content = Buffer.from(response.data.content, "base64");

        // Determine content type
        const ext = filename.split(".").pop()?.toLowerCase();
        let contentType = "application/octet-stream";

        if (ext === "png") contentType = "image/png";

        if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";

        if (ext === "gif") contentType = "image/gif";

        if (ext === "webp") contentType = "image/webp";

        if (ext === "svg") contentType = "image/svg+xml";

        return new NextResponse(content, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }

      return NextResponse.json({ error: "File not found" }, { status: 404 });
    } catch (error) {
      console.error("Error fetching trash media:", error);

      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Server error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
