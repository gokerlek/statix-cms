import { NextResponse } from "next/server";

import { getGitHubCMS } from "@/lib/github-cms";
import { getOrphanedMediaPaths } from "@/lib/media-utils";
import { statixConfig } from "@/statix.config";

export async function GET() {
  try {
    const github = getGitHubCMS();
    const files = await github.listFiles(statixConfig.mediaFolder, true);

    // Filter for images only
    const images = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name),
    );

    // Calculate orphaned status
    const orphanedPaths = await getOrphanedMediaPaths(images);

    // Add serve URL for each file (works with private repos)
    const imagesWithUrls = images.map((file) => {
      const relativePath = file.path.replace(/^public\/uploads\//, "");

      return {
        ...file,
        url: `/api/media/serve/${relativePath}`,
        isOrphaned: orphanedPaths.has(file.path),
      };
    });

    return NextResponse.json(imagesWithUrls);
  } catch (error) {
    console.error("Failed to list media:", error);

    return NextResponse.json(
      { error: "Failed to list media" },
      { status: 500 },
    );
  }
}
