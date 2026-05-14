import { unstable_cache } from "next/cache";

import {
  getContentIndex,
  isFileOrphaned,
  isMediaOrphaned,
} from "@/statix/lib/content-index";
import { formatStatus, resolveStatus } from "@/statix/lib/content-status";
import type { Collection } from "@/statix/types/cms";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import { listR2Media, listR2Trash } from "@/statix/lib/r2";
import { statixConfig } from "@/statix.config";

interface FileContent {
  translations?: Record<string, Record<string, unknown>>;
  [key: string]: unknown;
}

export async function getCollectionStats() {
  const github = getGitHubCMS();

  const stats = await Promise.all(
    statixConfig.collections.map(async (collection) => {
      const files = await github.getCollection(collection.path);

      // Get last updated time
      const lastUpdated = await github.getLastCommitDate(collection.path);

      // Calculate status breakdown
      const statusBreakdown: Record<string, number> = {};
      let singletonContent: Record<string, unknown> | null = null;

      if (collection.type === "singleton") {
        // Singletons always use index.json as their canonical file
        const singletonPath = `${collection.path}/index.json`;
        const file = await github.getFile(singletonPath);

        if (file && file.content && typeof file.content === "object") {
          singletonContent = file.content as Record<string, unknown>;
        }
      }

      // Read file contents to check actual status
      if (collection.type === "singleton") {
        // Singleton: only count the canonical index.json
        if (singletonContent) {
          const status = resolveStatus(
            (singletonContent as { status?: string }).status,
          );
          statusBreakdown[formatStatus(status)] = 1;
        }
      } else {
        // Collection: count all files
        const fileContents = await Promise.all(
          files.map((f) => github.getFile(f.path)),
        );

        fileContents.forEach((file) => {
          if (file && file.content && typeof file.content === "object") {
            const status = resolveStatus(
              (file.content as { status?: string }).status,
            );
            statusBreakdown[formatStatus(status)] =
              (statusBreakdown[formatStatus(status)] || 0) + 1;
          }
        });
      }

      return {
        ...collection,
        count: files.length,
        lastUpdated,
        statusBreakdown,
        content: singletonContent,
      };
    }),
  );

  return stats;
}

export async function getRecentActivity(limit: number = 5) {
  const github = getGitHubCMS();

  return await github.getRecentCommits(limit);
}


export async function getLocalizationStats() {
  const github = getGitHubCMS();
  const locales = statixConfig.i18n?.locales || ["en"];
  const defaultLocale = statixConfig.i18n?.defaultLocale || "en";

  // Flatten all files from all collections
  const allFiles = await Promise.all(
    statixConfig.collections.map(async (collection) => {
      const files = await github.getCollection(collection.path);

      return Promise.all(
        files.map(async (file) => {
          const content = await github.getFile(file.path);

          return {
            ...content,
            collection: collection as Collection,
          };
        }),
      );
    }),
  );

  const flatFiles = allFiles
    .flat()
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const localizationStats = locales.map((locale) => {
    let totalEntries = 0;
    let translatedEntries = 0;

    // Calculate stats per collection
    const collectionStats = statixConfig.collections.map((collection) => {
      // Filter files for this collection
      const collectionFiles = flatFiles.filter(
        (f) => f.collection.slug === collection.slug,
      );

      let collectionTotal = 0;
      let collectionTranslated = 0;

      // Check if collection has localized fields
      const hasLocalizedFields = collection.fields.some((f) => f.localized);

      if (!hasLocalizedFields) {
        return {
          slug: collection.slug,
          label: collection.label,
          totalEntries: collectionFiles.length,
          translatedEntries: collectionFiles.length, // Considered fully translated if no localized fields
          percentage: 100,
        };
      }

      collectionFiles.forEach((file) => {
        const content = file.content as FileContent;

        if (!content) return;

        collectionTotal++;

        // For default locale, it's always "translated" if it exists
        if (locale === defaultLocale) {
          collectionTranslated++;

          return;
        }

        // Check if translations exist for this locale
        if (
          content.translations &&
          content.translations[locale] &&
          Object.keys(content.translations[locale]).length > 0
        ) {
          // Check if all required localized fields are present
          const requiredLocalizedFields = collection.fields.filter(
            (f) => f.localized && f.required,
          );

          const isComplete = requiredLocalizedFields.every(
            (f) =>
              content.translations?.[locale][f.name] !== undefined &&
              content.translations?.[locale][f.name] !== "",
          );

          if (isComplete) {
            collectionTranslated++;
          }
        }
      });

      return {
        slug: collection.slug,
        label: collection.label,
        totalEntries: collectionTotal,
        translatedEntries: collectionTranslated,
        percentage:
          collectionTotal > 0
            ? Math.round((collectionTranslated / collectionTotal) * 100)
            : 0,
      };
    });

    // Aggregate totals
    collectionStats.forEach((stat) => {
      totalEntries += stat.totalEntries;
      translatedEntries += stat.translatedEntries;
    });

    return {
      locale,
      totalEntries,
      translatedEntries,
      percentage:
        totalEntries > 0
          ? Math.round((translatedEntries / totalEntries) * 100)
          : 0,
      collections: collectionStats,
    };
  });

  return localizationStats;
}

export const getSystemStats = unstable_cache(
  async () => {
    const github = getGitHubCMS();
    const [rateLimit, repoDetails] = await Promise.all([
      github.getRateLimit(),
      github.getRepoDetails(),
    ]);

    return { rateLimit, repoDetails };
  },
  ["system-stats"],
  { revalidate: 300 },
);

export async function getMediaStats() {
  // R2'den dosya listesi ve trash
  const [r2Result, r2Trash] = await Promise.all([
    listR2Media("uploads/").catch(() => ({ items: [], nextCursor: undefined })),
    listR2Trash().catch(() => []),
  ]);

  // Uzantısı olmayan dosyaları da dahil et (WhatsApp gibi)
  const mediaFiles = r2Result.items.filter((f) => !f.key.endsWith("/"));

  const totalSize = mediaFiles.reduce((acc, f) => acc + (f.size ?? 0), 0);

  // Dosya tipi dağılımı — bilinmeyen/uzantısız dosyalar "other"
  const KNOWN_EXTS = new Set(["jpg","jpeg","png","gif","webp","svg","pdf","mp4","mov","avi","zip","doc","docx"]);
  const typeDistribution: Record<string, number> = {};
  mediaFiles.forEach((f) => {
    const name = f.key.split("/").pop() ?? "";
    const dotIdx = name.lastIndexOf(".");
    const candidate = dotIdx > 0 ? name.slice(dotIdx + 1).toLowerCase() : "";
    const ext = KNOWN_EXTS.has(candidate) ? candidate : "other";
    typeDistribution[ext] = (typeDistribution[ext] ?? 0) + 1;
  });

  // Son aktivite: canlı dosyalar + trash — lastModified'a göre sırala
  const liveActivity = mediaFiles.map((f) => ({
    sha: f.key,
    filename: f.key.split("/").pop() ?? f.key,
    status: "live" as const,
    url: `/api/media/serve/${f.key}`,
    _ts: new Date(f.lastModified ?? 0).getTime(),
  }));

  const trashWithTs = r2Trash.map((t) => ({
    sha: t.trashKey,
    filename: t.originalKey.split("/").pop() ?? t.originalKey,
    status: "trash" as const,
    url: `/api/media/serve/${t.trashKey}`,
    _ts: new Date(t.deletedAt ?? 0).getTime(),
  }));

  const latestUploads = [...liveActivity, ...trashWithTs]
    .sort((a, b) => b._ts - a._ts)
    .slice(0, 6)
    .map(({ _ts: _, ...rest }) => rest);

  // Orphaned: içerik taraması başarılıysa gerçek sayı, yoksa null (UI "-" gösterir)
  let orphanedCount: number | null = null;
  try {
    const { index: contentIndex, ok } = await getContentIndex();

    if (ok) {
      orphanedCount = mediaFiles.filter((f) =>
        isMediaOrphaned(contentIndex, f.key.split("/").pop() ?? ""),
      ).length;
    }
  } catch {
    orphanedCount = null;
  }

  return {
    count: mediaFiles.length,
    totalSize,
    typeDistribution,
    latestUploads,
    orphanedCount,
    trashCount: r2Trash.length,
  };
}

/**
 * File stats — mirror of `getMediaStats` for the `files/` R2 prefix.
 *
 * Same shape so `FilesOverview` can reuse the MediaOverview rendering
 * vocabulary (stat tiles, type distribution list, recent-activity grid
 * with status badges). Orphan detection reads from the same
 * `getContentIndex()` blob — File field values are stored as full
 * `files/xxx` keys, so `isFileOrphaned` checks both the key and the
 * trailing filename fragment to be resilient to either convention.
 *
 * Trash isn't wired for File uploads yet (no soft-delete flow) so the
 * trash slice stays at 0 — `status` enum still supports `trash` so V2
 * can light up without shape changes.
 */
export async function getFileStats() {
  const r2Result = await listR2Media("files/").catch(() => ({
    items: [],
    nextCursor: undefined,
  }));

  const files = r2Result.items.filter((f) => !f.key.endsWith("/"));

  const totalSize = files.reduce((acc, f) => acc + (f.size ?? 0), 0);

  // Known document types — anything else bucketed as "other" so the type
  // panel doesn't explode on rare exotic uploads.
  const KNOWN_EXTS = new Set([
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "zip", "rar", "7z", "tar", "gz",
    "csv", "json", "xml",
    "txt", "md",
  ]);
  const typeDistribution: Record<string, number> = {};
  files.forEach((f) => {
    const name = f.key.split("/").pop() ?? "";
    const dotIdx = name.lastIndexOf(".");
    const candidate = dotIdx > 0 ? name.slice(dotIdx + 1).toLowerCase() : "";
    const ext = KNOWN_EXTS.has(candidate) ? candidate : "other";
    typeDistribution[ext] = (typeDistribution[ext] ?? 0) + 1;
  });

  // Share the content index with media stats — one GitHub scan per cache
  // window covers both orphan queries.
  let orphanedKeys = new Set<string>();
  let orphanedCount: number | null = null;
  try {
    const { index: contentIndex, ok } = await getContentIndex();
    if (ok) {
      orphanedKeys = new Set(
        files
          .filter((f) => isFileOrphaned(contentIndex, f.key))
          .map((f) => f.key),
      );
      orphanedCount = orphanedKeys.size;
    }
  } catch {
    orphanedCount = null;
  }

  const latestUploads = files
    .map((f) => ({
      sha: f.key,
      key: f.key,
      filename: f.key.split("/").pop() ?? f.key,
      status: orphanedKeys.has(f.key)
        ? ("orphaned" as const)
        : ("live" as const),
      url: `/api/media/serve/${f.key}`,
      size: f.size,
      _ts: new Date(f.lastModified ?? 0).getTime(),
    }))
    .sort((a, b) => b._ts - a._ts)
    .slice(0, 6)
    .map(({ _ts: _, ...rest }) => rest);

  return {
    count: files.length,
    totalSize,
    typeDistribution,
    latestUploads,
    orphanedCount,
    trashCount: 0,
  };
}
