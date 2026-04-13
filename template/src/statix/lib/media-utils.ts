import { getContentIndex, isMediaOrphaned } from "@/statix/lib/content-index";
import { getGitHubCMS, GitHubFile } from "@/statix/lib/github-cms";
import { statixConfig } from "@/statix.config";

/**
 * Scans all content in the CMS and identifies which media files are orphaned (unused).
 * Returns a Set of orphaned file paths.
 */
export async function getOrphanedMediaPaths(
  mediaFiles: GitHubFile[],
): Promise<Set<string>> {
  const { index, ok } = await getContentIndex();

  if (!ok) return new Set<string>();

  const orphanedPaths = new Set<string>();

  mediaFiles.forEach((mediaFile) => {
    if (isMediaOrphaned(index, mediaFile.name)) {
      orphanedPaths.add(mediaFile.path);
    }
  });

  return orphanedPaths;
}

interface MediaReference {
  path: string;
  title: string;
  collection: string;
}

/**
 * Finds all content files that reference a specific media file.
 * Returns a list of references with path, title, and collection info.
 */
export async function getMediaReferences(
  mediaFilename: string,
): Promise<MediaReference[]> {
  const github = getGitHubCMS();
  const references: MediaReference[] = [];

  // Helper to extract value from potentially i18n field
  const extractValue = (
    content: Record<string, unknown>,
    fieldName: string,
  ): string | undefined => {
    // First check direct field
    const value = content[fieldName];

    if (value) {
      // If it's a string, return directly
      if (typeof value === "string") return value;

      // If it's an i18n object like {en: "...", tr: "..."}
      if (typeof value === "object") {
        const localeValue = value as Record<string, string>;
        const defaultLocale = statixConfig.i18n?.defaultLocale || "en";

        return (
          localeValue[defaultLocale] ||
          Object.values(localeValue)[0] ||
          undefined
        );
      }
    }

    // Check translations object for localized fields
    const translations = content.translations as
      | Record<string, Record<string, unknown>>
      | undefined;

    if (translations) {
      const defaultLocale = statixConfig.i18n?.defaultLocale || "en";
      const locales = Object.keys(translations);

      // Try default locale first
      if (translations[defaultLocale]?.[fieldName]) {
        const val = translations[defaultLocale][fieldName];

        if (typeof val === "string") return val;
      }

      // Try any available locale
      for (const locale of locales) {
        if (translations[locale]?.[fieldName]) {
          const val = translations[locale][fieldName];

          if (typeof val === "string") return val;
        }
      }
    }

    return undefined;
  };

  // Get all content files from all collections in parallel
  const collectionResults = await Promise.allSettled(
    statixConfig.collections.map(async (collection) => {
      const collectionFiles = await github.getCollection(collection.path);
      const fileResults = await Promise.allSettled(
        collectionFiles.map((file) => github.getFile(file.path).then((fileData) => ({ file, fileData }))),
      );
      return { collection, fileResults };
    }),
  );

  for (const collResult of collectionResults) {
    if (collResult.status !== "fulfilled") continue;
    const { collection, fileResults } = collResult.value;

    for (const fileResult of fileResults) {
      if (fileResult.status !== "fulfilled") continue;
      const { file, fileData } = fileResult.value;

      if (!fileData?.content) continue;

      const contentStr = JSON.stringify(fileData.content);

      if (contentStr.includes(mediaFilename)) {
        const content = fileData.content as Record<string, unknown>;
        const titleField = collection.titleField || "title";

        const title =
          extractValue(content, titleField) ||
          extractValue(content, "title") ||
          extractValue(content, "name") ||
          file.name.replace(".json", "");

        references.push({
          path: file.path,
          title,
          collection: collection.label,
        });
      }
    }
  }

  return references;
}
