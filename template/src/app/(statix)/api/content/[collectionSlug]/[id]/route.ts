import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { contentSaveSchema } from "@/statix/lib/api-schemas";
import { handleApiError } from "@/statix/lib/api-response";
import { writeAudit, getIp } from "@/statix/lib/audit";
import { ROUTES } from "@/statix/lib/constants";
import {
  CONTENT_STATUSES,
  DEFAULT_STATUS,
  resolveStatus,
} from "@/statix/lib/content-status";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import { requireCollectionPermission, getUserPermissions } from "@/statix/lib/session";
import { checkSlugAvailable } from "@/statix/lib/slug-index";
import { slugify } from "@/statix/lib/utils";
import { statixConfig } from "@/statix.config";
import { CP, hasCollectionPermission } from "@/statix/types/permissions";

interface RouteContext {
  params: Promise<{ collectionSlug: string; id: string }>;
}

// ─── GET ──────────────────────────────────────────────────────────

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { collectionSlug, id } = await context.params;
    await requireCollectionPermission(collectionSlug, CP.VIEW);
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

    // Try the canonical location first (content/<collection>/<id>.json)
    // then fall back to legacy status-folder layout for older content.
    const filePath = `${collection.path}/${id}.json`;
    let result = await github.getFile(filePath);
    let foundStatus = DEFAULT_STATUS;

    if (!result) {
      for (const status of CONTENT_STATUSES) {
        const legacyPath = `${collection.path}/${status}/${id}.json`;
        result = await github.getFile(legacyPath);
        if (result) {
          foundStatus = status;
          break;
        }
      }
    }

    if (!result) {
      // Singletons are optional until they're first saved — return empty
      // so the editor can start from a blank state.
      if (collection.type === "singleton") {
        return NextResponse.json({});
      }
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = {
      ...(result.content as object),
      status:
        resolveStatus((result.content as { status?: string }).status) ||
        foundStatus,
    };

    return NextResponse.json(content);
  } catch (error) {
    return handleApiError(error, "Failed to load content");
  }
}

// ─── POST / PUT ───────────────────────────────────────────────────

/**
 * Shape of the metadata we persist. User payload NEVER writes this — every
 * field is server-inferred or read from the existing file.
 */
interface ContentMeta {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  status?: string;
}

/** Result of locating an existing file for an id across canonical + legacy paths. */
interface ExistingFile {
  path: string;
  sha: string;
  content: Record<string, unknown>;
  meta: ContentMeta | undefined;
  status: string | undefined;
}

async function findExistingFile(
  github: ReturnType<typeof getGitHubCMS>,
  collectionPath: string,
  id: string,
): Promise<ExistingFile | null> {
  // Canonical path first.
  const canonical = `${collectionPath}/${id}.json`;
  const canonicalHit = await github.getFile(canonical);
  if (canonicalHit) {
    return buildExisting(canonical, canonicalHit);
  }

  // Legacy status-folder layout.
  for (const status of CONTENT_STATUSES) {
    const legacy = `${collectionPath}/${status}/${id}.json`;
    const hit = await github.getFile(legacy);
    if (hit) return buildExisting(legacy, hit);
  }

  return null;
}

function buildExisting(
  path: string,
  raw: { content: unknown; sha: string },
): ExistingFile {
  const content = (raw.content as Record<string, unknown>) ?? {};
  const meta =
    (content._meta as ContentMeta | undefined) ?? undefined;
  const status =
    (content.status as string | undefined) ?? meta?.status ?? undefined;
  return { path, sha: raw.sha, content, meta, status };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { collectionSlug, id } = await context.params;
    const { session } = await requireCollectionPermission(
      collectionSlug,
      CP.EDIT,
    );
    const collection = statixConfig.collections.find(
      (c) => c.slug === collectionSlug,
    );

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    // ── Validate + strip spoofable fields ────────────────────────
    // `_meta`, `id` never come from the client — they are server-controlled.
    // Zod's passthrough keeps every other user-defined field (title, blocks,
    // content, …) flowing through unchanged.
    const rawData = await request.json();
    const parsed = contentSaveSchema.safeParse(rawData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid content data" },
        { status: 400 },
      );
    }
    const {
      _meta: _ignoredMeta,
      id: _ignoredId,
      ...userContent
    } = parsed.data as Record<string, unknown>;

    const newStatus = (userContent as { status?: string }).status;

    // ── Resolve slug (server-authoritative) ──────────────────────
    const slugSource = (userContent.title ||
      userContent.name ||
      userContent.label) as string | undefined;
    if (slugSource) {
      userContent.slug = slugify(slugSource);
    }

    // ── Identifier (UUID for new items; kept as-is for updates) ──
    let identifier = id;
    if (id === "new") {
      identifier = crypto.randomUUID();
    }

    const github = getGitHubCMS();

    // ── Single fetch: locate the current file (if any) ───────────
    // Replaces the pre-v0.2 triple-getFile flow. All downstream checks read
    // from `existing` instead of re-fetching.
    const existing =
      id === "new" ? null : await findExistingFile(github, collection.path, id);

    // ── Slug uniqueness (collections only — singletons skip) ─────
    // Only check when we're creating or when the slug actually changed.
    if (
      collection.type !== "singleton" &&
      typeof userContent.slug === "string" &&
      userContent.slug.length > 0 &&
      userContent.slug !== (existing?.content.slug as string | undefined)
    ) {
      const slugCheck = await checkSlugAvailable(
        collectionSlug,
        userContent.slug,
        existing ? identifier : null,
      );
      if (slugCheck === "duplicate") {
        return NextResponse.json(
          {
            error: `Slug "${userContent.slug}" already exists in this collection. Change the title or slug and try again.`,
          },
          { status: 409 },
        );
      }
      // "unchecked" means the collection is too big to scan; trust the save
      // retry to catch real collisions.
    }

    // ── Publish permission gate ─────────────────────────────────
    // Only enforced when the status *changes* to/from published.
    if (newStatus && existing) {
      const oldStatus = existing.status;
      if (oldStatus !== newStatus) {
        const userPerms = await getUserPermissions(session.user.id);
        const canPublish = hasCollectionPermission(
          userPerms,
          collectionSlug,
          CP.PUBLISH,
        );

        if (!canPublish) {
          if (newStatus === "published") {
            return NextResponse.json(
              { error: "You don't have permission to publish in this collection" },
              { status: 403 },
            );
          }
          if (oldStatus === "published") {
            return NextResponse.json(
              { error: "You don't have permission to unpublish content in this collection" },
              { status: 403 },
            );
          }
        }
      }
    }

    // ── Target path resolution + legacy migration ───────────────
    const targetPath = `${collection.path}/${identifier}.json`;
    let sha: string | undefined;

    if (existing) {
      if (existing.path !== targetPath) {
        // Moving from a legacy status folder to the canonical root path.
        await github.deleteFile(existing.path, existing.sha, session.user);
        sha = undefined; // creating at new path
      } else {
        sha = existing.sha; // updating in place
      }
    }

    // ── Server-controlled metadata ──────────────────────────────
    const now = new Date().toISOString();
    const meta: ContentMeta = {
      createdAt: existing?.meta?.createdAt ?? now,
      updatedAt: now,
      createdBy: existing?.meta?.createdBy ?? session.user?.email,
      updatedBy: session.user?.email,
    };

    // Final payload: user content + server-injected id + _meta.
    const contentWithMeta = {
      ...userContent,
      id: identifier,
      _meta: meta,
    };

    await github.saveFile(targetPath, contentWithMeta, sha, session.user);

    // Slug set cache is now stale — next check re-fetches from GitHub.
    // Next.js 16 requires a cache-life profile as the second argument.
    revalidateTag(`slugs-${collectionSlug}`, "max");

    writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: id === "new" ? "content.create" : "content.update",
      entityType: "content",
      entityId: identifier,
      metadata: { collection: collectionSlug, path: targetPath },
      ipAddress: getIp(request),
    }).catch(console.error);

    revalidatePath(ROUTES.ADMIN.COLLECTION(collectionSlug));

    return NextResponse.json({ success: true, id: identifier });
  } catch (error) {
    return handleApiError(error, "Failed to save content");
  }
}
