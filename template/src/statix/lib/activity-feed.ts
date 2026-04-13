import { and, desc, eq, isNull, lt, or } from "drizzle-orm";

import { db } from "@/statix/lib/db";
import { auditLog, user } from "@/statix/db/schema";
import { getCachedCommits, ParsedCommit } from "@/statix/lib/monitor-data";
import { statixConfig } from "@/statix.config";
import ui from "@/statix/content/ui.json";

export interface UnifiedActivityItem {
  id: string;                    // "commit:{sha}" | "audit:{uuid}"
  source: "github" | "audit";
  timestamp: Date;
  actorEmail: string | null;
  actorName: string | null;
  actorAvatar: string | null;    // relative path for internal (/api/...), full URL for GitHub
  actionKey: string;             // "content.update", "media.upload", "auth.login", etc.
  actionLabel: string;           // human-readable
  collectionLabel: string | null;
  detail: string | null;
  editUrl: string | null;        // /admin/{slug}/{id}
  externalUrl: string | null;    // GitHub commit URL
}

function getActionLabel(key: string): string {
  return (ui.monitor.actionLabels as Record<string, string>)[key] ?? key;
}

/** Strip origin from internal /api/ URLs so next/image accepts them as relative paths */
function toImageSrc(url: string | null): string | null {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    if (pathname.startsWith("/api/")) return pathname;
  } catch {
    // already relative
  }
  return url;
}

/**
 * Extracts collection label + CMS edit URL from a statix commit title.
 * Returns nulls for trash paths, bare filenames (restore), or unknown folders.
 */
function extractCollectionFromTitle(
  title: string,
): { collectionLabel: string | null; editUrl: string | null } {
  const match = title.match(
    /^(?:Create|Update|Delete|Soft-delete|Restore|Move)\s+(.+)$/i,
  );
  if (!match) return { collectionLabel: null, editUrl: null };

  const rawPath = match[1].trim();

  // Skip trash paths — internal, not navigable
  if (rawPath.startsWith("_trash/")) return { collectionLabel: null, editUrl: null };

  // Restore commits reference bare filename (e.g. "Restore image.jpg") — no directory
  const parts = rawPath.split("/").filter(Boolean);
  if (parts.length < 2) return { collectionLabel: null, editUrl: null };

  // Match first path segment against collection path last segment
  const folder = parts[0];
  const col = statixConfig.collections.find((c) => {
    const colFolder = c.path.split("/").pop() ?? c.path;
    return colFolder === folder;
  });
  if (!col) return { collectionLabel: null, editUrl: null };

  // Extract item ID (last segment, strip .json)
  const filename = parts[parts.length - 1];
  const itemId = filename.replace(/\.json$/, "");

  return {
    collectionLabel: col.label,
    editUrl: `/admin/${col.slug}/${itemId}`,
  };
}

function normalizeCommit(c: ParsedCommit): UnifiedActivityItem {
  const actionKey =
    c.action === "create"
      ? "content.create"
      : c.action === "update"
        ? "content.update"
        : c.action === "delete" || c.action === "soft-delete"
          ? "content.delete"
          : "github.commit";

  const { collectionLabel, editUrl } = extractCollectionFromTitle(c.title);

  return {
    id: `commit:${c.sha}`,
    source: "github",
    timestamp: new Date(c.time ?? c.date),
    actorEmail: c.user,
    actorName: c.name ?? c.authorName,
    actorAvatar: toImageSrc(c.avatar_url),
    actionKey,
    actionLabel: getActionLabel(actionKey),
    collectionLabel,
    detail: c.title,
    editUrl,
    externalUrl: c.html_url ?? null,
  };
}

type AuditRow = {
  id: string;
  action: string;
  userEmail: string | null;
  userName: string | null;
  userImage: string | null;
  metadata: string | null;
  createdAt: Date;
  entityId: string | null;
};

function normalizeAudit(r: AuditRow): UnifiedActivityItem {
  let collectionLabel: string | null = null;
  let editUrl: string | null = null;

  // Parse structured metadata for content ops
  if (r.metadata && r.action.startsWith("content.")) {
    try {
      const meta = JSON.parse(r.metadata) as Record<string, string>;
      if (meta.collection) {
        const col = statixConfig.collections.find((c) => c.slug === meta.collection);
        if (col) {
          collectionLabel = col.label;
          if (r.entityId && r.action !== "content.delete") {
            editUrl = `/admin/${col.slug}/${r.entityId}`;
          }
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Metadata summary for detail text
  let detail: string | null = null;
  if (r.metadata) {
    try {
      const obj = JSON.parse(r.metadata) as Record<string, unknown>;
      const entries = Object.entries(obj)
        .filter(([k]) => k !== "path") // path is too verbose
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(", ");
      if (entries) detail = entries;
    } catch {
      detail = r.metadata;
    }
  }

  return {
    id: `audit:${r.id}`,
    source: "audit",
    timestamp: r.createdAt,
    actorEmail: r.userEmail,
    actorName: r.userName,
    actorAvatar: toImageSrc(r.userImage),
    actionKey: r.action,
    actionLabel: getActionLabel(r.action),
    collectionLabel,
    detail,
    editUrl,
    externalUrl: null,
  };
}

/**
 * Dedup: when a content op generates both a GitHub commit and an audit row,
 * keep the audit row (has structured metadata), suppress the commit.
 * Match criteria: same actorEmail + compatible action + timestamps within 15s.
 */
function deduplicateItems(items: UnifiedActivityItem[]): UnifiedActivityItem[] {
  const AUDIT_TO_COMMIT_ACTION: Record<string, string[]> = {
    "content.create": ["content.create", "github.commit"],
    "content.update": ["content.update", "github.commit"],
    "content.delete": ["content.delete", "github.commit"],
  };

  const suppressedCommitIds = new Set<string>();

  const auditItems = items.filter((i) => i.source === "audit");
  const commitItems = items.filter((i) => i.source === "github");

  for (const auditItem of auditItems) {
    const matchingCommitKeys = AUDIT_TO_COMMIT_ACTION[auditItem.actionKey];
    if (!matchingCommitKeys) continue;

    for (const commitItem of commitItems) {
      if (suppressedCommitIds.has(commitItem.id)) continue;
      if (commitItem.actorEmail !== auditItem.actorEmail) continue;
      if (!matchingCommitKeys.includes(commitItem.actionKey)) continue;

      const timeDiff = Math.abs(
        auditItem.timestamp.getTime() - commitItem.timestamp.getTime(),
      );
      if (timeDiff > 15_000) continue; // 15 second window

      suppressedCommitIds.add(commitItem.id);
      break;
    }
  }

  return items.filter(
    (i) => i.source !== "github" || !suppressedCommitIds.has(i.id),
  );
}

export async function getUnifiedActivity(opts: {
  limit: number;
  cursor?: string; // ISO timestamp (exclusive upper bound)
}): Promise<{ items: UnifiedActivityItem[]; nextCursor: string | null }> {
  const since = opts.cursor ? new Date(opts.cursor) : undefined;
  const fetchLimit = opts.limit + 20; // buffer for dedup losses

  const [commits, auditRows] = await Promise.all([
    getCachedCommits(fetchLimit),
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        userEmail: auditLog.userEmail,
        userName: user.name,
        userImage: user.image,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
        entityId: auditLog.entityId,
      })
      .from(auditLog)
      .leftJoin(
        user,
        or(
          eq(auditLog.userEmail, user.email),
          and(isNull(auditLog.userEmail), eq(auditLog.entityId, user.id)),
        ),
      )
      .where(since ? lt(auditLog.createdAt, since) : undefined)
      .orderBy(desc(auditLog.createdAt))
      .limit(fetchLimit),
  ]);

  // Filter commits by cursor if provided
  const filteredCommits = since
    ? commits.filter((c) => new Date(c.time ?? c.date) < since)
    : commits;

  const commitItems = filteredCommits.map(normalizeCommit);
  const auditItems = auditRows.map(normalizeAudit);

  // Merge, sort newest-first, dedup, then slice
  const merged = [...commitItems, ...auditItems].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
  const deduped = deduplicateItems(merged);
  const page = deduped.slice(0, opts.limit);

  const nextCursor =
    page.length === opts.limit && page.length > 0
      ? page[page.length - 1].timestamp.toISOString()
      : null;

  return { items: page, nextCursor };
}
