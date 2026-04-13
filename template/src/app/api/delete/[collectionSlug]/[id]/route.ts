import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { CONTENT_STATUSES } from "@/statix/lib/content-status";
import { requireCollectionPermission } from "@/statix/lib/session";
import { ROUTES } from "@/statix/lib/constants";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import { statixConfig } from "@/statix.config";
import { writeAudit, getIp } from "@/statix/lib/audit";
import { CP } from "@/statix/types/permissions";

interface RouteContext {
  params: Promise<{ collectionSlug: string; id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { collectionSlug, id } = await context.params;

    let session: Awaited<ReturnType<typeof requireCollectionPermission>>["session"];
    try {
      ({ session } = await requireCollectionPermission(collectionSlug, CP.DELETE));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Forbidden";
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
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
      const statuses = CONTENT_STATUSES;

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

    await github.softDeleteFile(filePath, existing.sha, "collection_item", session.user);

    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "content.delete",
      entityType: "content",
      entityId: id,
      metadata: { collection: collectionSlug, path: filePath },
      ipAddress: getIp(request),
    }).catch(console.error);

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
