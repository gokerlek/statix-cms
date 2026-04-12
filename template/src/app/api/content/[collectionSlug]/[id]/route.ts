import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { contentSaveSchema } from "@/lib/api-schemas";
import { handleApiError } from "@/lib/api-response";
import { CONTENT_STATUSES, DEFAULT_STATUS, resolveStatus } from "@/lib/content-status";
import { requireAdmin } from "@/lib/session";
import { ROUTES } from "@/lib/constants";
import { getGitHubCMS } from "@/lib/github-cms";
import { slugify } from "@/lib/utils";
import { statixConfig } from "@/statix.config";
import { writeAudit, getIp } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ collectionSlug: string; id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();

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

    // Try to find the file
    // Check root first (new standard)
    const filePath = `${collection.path}/${id}.json`;
    let result = await github.getFile(filePath);
    let foundStatus = DEFAULT_STATUS; // Default for root files

    // If not found, check status folders (legacy support)
    if (!result) {
      const statuses = CONTENT_STATUSES;

      for (const status of statuses) {
        const legacyPath = `${collection.path}/${status}/${id}.json`;

        result = await github.getFile(legacyPath);

        if (result) {
          foundStatus = status;
          break;
        }
      }
    }

    if (!result) {
      // If it's a singleton, return empty content so we can create it
      if (collection.type === "singleton") {
        return NextResponse.json({});
      }

      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Add status to the response if not present in content
    const content = {
      ...(result.content as object),
      status: resolveStatus((result.content as { status?: string }).status) || foundStatus,
    };

    return NextResponse.json(content);
  } catch (error) {
    return handleApiError(error, "Failed to load content");
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin();

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

    const rawData = await request.json();
    const parsed = contentSaveSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid content data" },
        { status: 400 },
      );
    }
    const data = parsed.data as Record<string, unknown>;

    const github = getGitHubCMS();

    // Determine the filename
    // Determine the filename
    let identifier = id;

    // Auto-generate slug from title, name, or label
    const slugSource = (data.title || data.name || data.label) as string | undefined;

    if (slugSource) {
      data.slug = slugify(slugSource);
    }

    if (id === "new") {
      identifier = crypto.randomUUID();
      // Ensure the generated ID is saved in the content
      data.id = identifier;
    }

    // Target path is always root now
    const targetPath = `${collection.path}/${identifier}.json`;

    // Check if file exists in a different location (for moves/migration)
    const statuses = ["draft", "published", "archived"];
    let oldPath: string | undefined;
    let oldSha: string | undefined;

    if (id !== "new") {
      // Check root first
      const p = `${collection.path}/${id}.json`;
      const existing = await github.getFile(p);

      if (existing) {
        oldPath = p;
        oldSha = existing.sha;
      }

      // If not in root, check status folders (legacy)
      if (!oldPath) {
        for (const s of statuses) {
          const p = `${collection.path}/${s}/${id}.json`;
          const existing = await github.getFile(p);

          if (existing) {
            oldPath = p;
            oldSha = existing.sha;
            break;
          }
        }
      }
    }

    // If moving (oldPath exists and is different from targetPath), delete old file
    // This handles:
    // 1. Renaming (slug change) - NO LONGER APPLIES TO UUID FILENAMES (filename stays same)
    // 2. Migration (moving from subfolder to root)
    if (oldPath && oldPath !== targetPath && oldSha) {
      await github.deleteFile(oldPath, oldSha, session.user);
      // Reset SHA for the new file creation since it's a new path
      oldSha = undefined;
    } else if (oldPath === targetPath) {
      // Updating in place, keep the SHA
    } else {
      // New file or moved from somewhere else (SHA reset)
      oldSha = undefined;
    }

    // Add metadata
    const contentWithMeta = {
      ...data,
      _meta: {
        createdAt: (data._meta as Record<string, unknown>)?.createdAt as string || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: session.user?.email,
        updatedBy: session.user?.email,
      },
    };

    // Save to target path
    // Note: If we moved, oldSha is undefined, so it creates a new file
    // If we updated in place, oldSha is passed to update
    await github.saveFile(targetPath, contentWithMeta, oldSha, session.user);

    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: id === "new" ? "content.create" : "content.update",
      entityType: "content",
      entityId: identifier,
      metadata: { collection: collectionSlug, path: targetPath },
      ipAddress: getIp(request),
    }).catch(console.error);

    // Revalidate the collection page
    revalidatePath(ROUTES.ADMIN.COLLECTION(collectionSlug));

    return NextResponse.json({ success: true, id: identifier });
  } catch (error) {
    return handleApiError(error, "Failed to save content");
  }
}
