import { NextRequest, NextResponse } from "next/server";

import { getGitHubCMS } from "@/lib/github-cms";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  let path = "";
  let fullPath = "";

  try {
    const { path: pathArray } = await params;

    path = pathArray.join("/");
    fullPath = `public/uploads/${path}`;

    const github = getGitHubCMS();
    const response = await github.octokit.rest.repos.getContent({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path: fullPath,
      ref: process.env.GITHUB_BRANCH || "main",
    });

    let content: Buffer;

    if ("content" in response.data && response.data.content) {
      // Small files: content is directly available
      content = Buffer.from(response.data.content, "base64");
    } else if ("sha" in response.data && response.data.type === "file") {
      // Large files (>1MB): need to use blob API
      const blobResponse = await github.octokit.rest.git.getBlob({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        file_sha: response.data.sha,
      });

      content = Buffer.from(blobResponse.data.content, "base64");
    } else {
      return new NextResponse("File not found", { status: 404 });
    }

    // Determine content type based on file extension
    const ext = path.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };

    const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

    return new NextResponse(new Uint8Array(content), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 404
    ) {
      console.log(`File not found in repository: ${fullPath}`);

      return new NextResponse("File not found in repository", { status: 404 });
    }

    console.error("Failed to serve media:", error);

    return new NextResponse("Internal server error", { status: 500 });
  }
}
