import { getGitHubCMS } from "@/lib/github-cms";
import { getOrphanedMediaPaths } from "@/lib/media-utils";
import { statixConfig } from "@/statix.config";
import { GitHubCommit } from "@/types/github";

interface CollectionField {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  localized?: boolean;
}

interface Collection {
  slug: string;
  label: string;
  path: string;
  type?: "collection" | "singleton";
  fields: CollectionField[];
}

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

      if (collection.type === "singleton" && files.length > 0) {
        // For singletons, we want the content of the first (and only) file
        const file = await github.getFile(files[0].path);

        if (file && file.content && typeof file.content === "object") {
          singletonContent = file.content as Record<string, unknown>;
        }
      }

      if (collection.fields.some((f) => f.name === "status")) {
        // Fetch content for all files to check status
        // Note: This might be slow for large collections, consider optimizing or caching
        const fileContents = await Promise.all(
          files.map((f) => github.getFile(f.path)),
        );

        fileContents.forEach((file) => {
          if (
            file &&
            file.content &&
            typeof file.content === "object" &&
            "status" in file.content
          ) {
            const status = String(file.content.status);
            // Capitalize first letter
            const formattedStatus =
              status.charAt(0).toUpperCase() + status.slice(1);

            statusBreakdown[formattedStatus] =
              (statusBreakdown[formattedStatus] || 0) + 1;
          }
        });
      } else {
        // If no status field, assume all are Published (or just count them)
        if (files.length > 0) {
          statusBreakdown["Published"] = files.length;
        }
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

export async function getAllRecentActivity(limit: number = 100) {
  const github = getGitHubCMS();

  // Fetch a larger batch for client-side filtering/search
  // We limit to 100 for performance, but this "Detailed" view is still "Recent" activity
  return await github.getRecentCommits(limit, undefined, 1);
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

export async function getSystemStats() {
  const github = getGitHubCMS();
  const [rateLimit, repoDetails] = await Promise.all([
    github.getRateLimit(),
    github.getRepoDetails(),
  ]);

  return {
    rateLimit,
    repoDetails,
  };
}

export async function getMediaStats() {
  const github = getGitHubCMS();
  const files = await github.listFiles(statixConfig.mediaFolder, true);

  // Filter for images/media
  const mediaFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|gif|webp|svg|pdf|mp4)$/i.test(file.name),
  );

  const totalSize = mediaFiles.reduce((acc, file) => acc + file.size, 0);

  const typeDistribution: Record<string, number> = {};

  mediaFiles.forEach((file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "unknown";

    typeDistribution[ext] = (typeDistribution[ext] || 0) + 1;
  });

  // Get recent uploads/activity
  const recentCommits = await github.getRecentCommits(
    10,
    statixConfig.mediaFolder,
  );
  const trashItems = await github.getTrashItems();

  // Enrich commits with status
  const latestActivity = (recentCommits as GitHubCommit[])
    .map((commit: GitHubCommit) => {
      // Try to extract filename from commit message
      // Patterns: "Upload image: filename.ext", "Delete public/uploads/filename.ext", "Move filename.ext to trash"
      let filename = "";
      let action: "upload" | "delete" | "trash" | "restore" | "unknown" =
        "unknown";

      if (commit.message.startsWith("Upload image:")) {
        filename = commit.message.replace("Upload image:", "").trim();
        action = "upload";
      } else if (commit.message.startsWith("Delete public/uploads/")) {
        filename = commit.message.replace("Delete public/uploads/", "").trim();
        action = "delete";
      } else if (
        commit.message.startsWith("Move ") &&
        commit.message.includes(" to trash")
      ) {
        filename = commit.message
          .replace("Move ", "")
          .split(" to trash")[0]
          .trim();
        action = "trash";
      } else if (commit.message.startsWith("Restore ")) {
        filename = commit.message.replace("Restore ", "").trim();
        action = "restore";
      }

      // Determine status based on ACTION primarily to preserve history accuracy
      let status: "live" | "trash" | "deleted" | "restored" = "deleted";

      if (action === "upload") status = "live";
      else if (action === "trash") status = "trash";
      else if (action === "restore") status = "restored";
      else if (action === "delete") status = "deleted";

      let url = null;

      if (filename) {
        // Robust matching for Live files
        // We match if the basename is equal OR if the full path ends with the filename (handles subdirectories)
        const liveFile = mediaFiles.find(
          (f) => f.name === filename || f.path.endsWith(filename),
        );
        const isLive = !!liveFile;

        // Robust matching for Trash files
        // We match if the trash name (basename) is equal OR if the original path ends with the filename
        const isTrash = trashItems.some(
          (t) =>
            t.type === "media" &&
            (t.name === filename ||
              (t.originalPath && t.originalPath.endsWith(filename))),
        );

        if (isLive) {
          // Use the actual path from the file object, removing the media folder prefix
          // This handles nested files correctly (e.g. team/logo.svg)
          // Ensure we don't end up with undefined or partial paths
          const relativePath = liveFile?.path.replace(
            `${statixConfig.mediaFolder}/`,
            "",
          );

          url = `/api/media/serve/${relativePath}`;
        } else if (isTrash) {
          url = `/api/trash/media/${filename}`;

          // If the action was "delete" (permanently delete from original location),
          // but the file is found in trash, it means it was a soft delete (move to trash).
          // So we should show it as "trash", not "deleted".
          if (action === "delete") {
            status = "trash";
          }
        }
      }

      return {
        ...commit,
        filename,
        action,
        status,
        url,
      };
    })
    .filter((item) => item.filename); // Only show items where we identified a file

  // Calculate orphaned files
  const orphanedPaths = await getOrphanedMediaPaths(mediaFiles);

  return {
    count: mediaFiles.length,
    totalSize,
    typeDistribution,
    latestUploads: latestActivity.slice(0, 6), // Return top 6
    orphanedCount: orphanedPaths.size,
  };
}
