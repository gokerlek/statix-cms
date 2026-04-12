import { unstable_cache } from "next/cache";

import { getGitHubCMS } from "@/lib/github-cms";
import { statixConfig } from "@/statix.config";

/**
 * Builds a stringified content index from all collections.
 * Used for orphaned media detection — checks if a filename appears in any content.
 * Cached for 120 seconds to avoid repeated GitHub API calls.
 */
export const getContentIndex = unstable_cache(
  async (): Promise<{ index: string; ok: boolean }> => {
    try {
      const github = getGitHubCMS();

      const collectionResults = await Promise.allSettled(
        statixConfig.collections.map(async (col) => {
          const files = await github.getCollection(col.path);
          const fileContents = await Promise.allSettled(
            files.map((f) => github.getFile(f.path)),
          );
          return fileContents
            .filter((r) => r.status === "fulfilled" && r.value?.content)
            .map((r) =>
              JSON.stringify(
                (r as PromiseFulfilledResult<{ content: unknown }>).value
                  .content,
              ),
            );
        }),
      );

      const index = collectionResults
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => (r as PromiseFulfilledResult<string[]>).value)
        .join(" ");

      return { index, ok: true };
    } catch (err) {
      console.error("buildContentIndex error:", err);
      return { index: "", ok: false };
    }
  },
  ["content-index"],
  { revalidate: 120 },
);

/**
 * Check if a media file is orphaned (not referenced in any content).
 * Uses filename-based matching for consistency across all callers.
 */
export function isMediaOrphaned(
  contentIndex: string,
  filename: string,
): boolean {
  return !contentIndex.includes(filename);
}
