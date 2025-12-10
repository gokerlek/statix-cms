import { NextRequest, NextResponse } from "next/server";

import { resolveContentTitle } from "@/lib/content-utils";
import { getGitHubCMS } from "@/lib/github-cms";
import { statixConfig } from "@/statix.config";
import { ContentData } from "@/types/content";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const collection = statixConfig.collections.find((c) => c.slug === slug);

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    const github = getGitHubCMS();

    // Fetch all files recursively to find both root and legacy subfolder files
    const allFiles = await github.listFiles(collection.path, true);

    // Filter for JSON files
    const jsonFiles = allFiles.filter((file) => file.name.endsWith(".json"));

    // Fetch content for all files to get the status property
    // We use Promise.all for parallel fetching to improve performance
    const filesWithStatus = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const content = await github.getFile(file.path);
          const contentData = content?.content as
            | { status?: string }
            | undefined;
          const title = resolveContentTitle(
            collection,
            contentData as ContentData | null,
          );
          const status = contentData?.status || "published";

          return {
            ...file,
            title,
            status,
          };
        } catch (error) {
          console.error(`Failed to fetch content for ${file.path}`, error);

          return {
            ...file,
            status: "unknown",
          };
        }
      }),
    );

    return NextResponse.json(filesWithStatus);
  } catch (error) {
    console.error("Failed to list collection items:", error);

    return NextResponse.json(
      { error: "Failed to list collection items" },
      { status: 500 },
    );
  }
}
