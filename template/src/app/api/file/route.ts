import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { getMaxUploadSize } from "@/lib/file-validation";
import { getGitHubCMS } from "@/lib/github-cms";
import { formatFileSize } from "@/lib/utils";

/**
 * API route for uploading files to content/files folder (not public/uploads)
 * Files are stored as base64 encoded content in GitHub repo
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (from config or 5MB default)
    const maxSize = getMaxUploadSize();

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum ${formatFileSize(maxSize)} allowed.`,
        },
        { status: 400 },
      );
    }

    const github = getGitHubCMS();

    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${sanitizedName}`;

    // Store in content/files folder (not public)
    const path = `content/files/${filename}`;

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Upload to GitHub
    await github.octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      path,
      message: `Upload file: ${filename}`,
      content: base64,
      branch: process.env.GITHUB_BRANCH || "main",
    });

    // Return the path (not a URL since it's not public)
    return NextResponse.json({
      path,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("File upload error:", error);

    // Extract error message from GitHub API error
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload file";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * API route for deleting a file from content/files folder
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path } = await request.json();

    if (!path || !path.startsWith("content/files/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const github = getGitHubCMS();

    // Get file SHA first
    try {
      const response = await github.octokit.rest.repos.getContent({
        owner: process.env.GITHUB_OWNER!,
        repo: process.env.GITHUB_REPO!,
        path,
        ref: process.env.GITHUB_BRANCH || "main",
      });

      if ("sha" in response.data) {
        await github.octokit.rest.repos.deleteFile({
          owner: process.env.GITHUB_OWNER!,
          repo: process.env.GITHUB_REPO!,
          path,
          message: `Delete file: ${path}`,
          sha: response.data.sha,
          branch: process.env.GITHUB_BRANCH || "main",
        });

        return NextResponse.json({ success: true });
      }
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (error) {
    console.error("File delete error:", error);

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
