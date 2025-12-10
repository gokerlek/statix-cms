import { getGitHubCMS, GitHubFile } from "@/lib/github-cms";
import { statixConfig } from "@/statix.config";

/**
 * Scans all content in the CMS and identifies which media files are orphaned (unused).
 * Returns a Set of orphaned file paths (relative to the project root, e.g., "public/uploads/image.png").
 */
export async function getOrphanedMediaPaths(
  mediaFiles: GitHubFile[],
): Promise<Set<string>> {
  const github = getGitHubCMS();

  // 1. Get all content files
  const allContentFiles = await Promise.all(
    statixConfig.collections.map(async (collection) => {
      const collectionFiles = await github.getCollection(collection.path);

      return Promise.all(collectionFiles.map((f) => github.getFile(f.path)));
    }),
  );

  // Flatten and extract content strings
  const contentStrings: string[] = [];

  allContentFiles.flat().forEach((file) => {
    if (file && file.content) {
      const contentStr = JSON.stringify(file.content);

      contentStrings.push(contentStr);
    }
  });

  // 2. Check each media file for usage
  const orphanedPaths = new Set<string>();

  mediaFiles.forEach((mediaFile) => {
    // We check if the filename exists in any content
    // This is a simple check, but effective for most cases
    const filename = mediaFile.name;

    // Check if any content string contains the filename
    const isUsed = contentStrings.some((content) => content.includes(filename));

    if (!isUsed) {
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

  // Get all content files from all collections
  for (const collection of statixConfig.collections) {
    try {
      const collectionFiles = await github.getCollection(collection.path);

      for (const file of collectionFiles) {
        const fileData = await github.getFile(file.path);

        if (!fileData || !fileData.content) continue;

        const contentStr = JSON.stringify(fileData.content);

        // Check if this content references the media file
        if (contentStr.includes(mediaFilename)) {
          // Try to extract title from content
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
    } catch {
      // Collection might not exist
    }
  }

  return references;
}
