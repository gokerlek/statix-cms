import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { ROUTES } from "@/lib/constants";
import { getGitHubCMS } from "@/lib/github-cms";
import { statixConfig } from "@/statix.config";

interface RouteContext {
  params: Promise<{ collectionSlug: string; id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collectionSlug, id } = await context.params;
    const collection = statixConfig.collections.find(
      (c) => c.slug === collectionSlug,
    );

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    const github = getGitHubCMS();
    let filePath = `${collection.path}/${id}.json`;

    // Get file to get SHA
    let existing = await github.getFile(filePath);

    // If not found in root, check legacy status folders
    if (!existing) {
      const statuses = ["draft", "published", "archived"];

      for (const status of statuses) {
        const legacyPath = `${collection.path}/${status}/${id}.json`;

        existing = await github.getFile(legacyPath);

        if (existing) {
          filePath = legacyPath;
          break;
        }
      }
    }

    if (!existing) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await github.softDeleteFile(filePath, existing.sha, "collection_item");

    // Revalidate the collection page
    revalidatePath(ROUTES.ADMIN.COLLECTION(collectionSlug));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 },
    );
  }
}
