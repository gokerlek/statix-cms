import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/statix/lib/api-response";
import { resolveStatus } from "@/statix/lib/content-status";
import { resolveContentTitle } from "@/statix/lib/content-utils";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import {
  requireCollectionPermission,
  requireSession,
} from "@/statix/lib/session";
import { statixConfig } from "@/statix.config";
import { ContentData } from "@/statix/types/content";
import { CP } from "@/statix/types/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    // 1. Auth — must come first so unauthenticated probes can't enumerate
    //    collection existence via the 404 differential.
    await requireSession();

    // 2. Existence — 404 if the slug isn't a configured collection. Order:
    //    BEFORE the permission check so legitimate users with a typo get
    //    a clear 404 rather than a misleading 403.
    const { slug } = await params;
    const collection = statixConfig.collections.find((c) => c.slug === slug);
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    // 3. Permission — only after we know the collection exists.
    await requireCollectionPermission(slug, CP.VIEW);

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
          const status = resolveStatus(contentData?.status);

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
    return handleApiError(error, "Failed to list collection items", request);
  }
}
