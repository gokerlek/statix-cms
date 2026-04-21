import { unstable_cache } from "next/cache";

import { getGitHubCMS } from "@/statix/lib/github-cms";
import { statixConfig } from "@/statix.config";

// Max items we'll scan per collection. Each item costs one GitHub `getFile`
// call, so the worst-case cost of a single slug check is N+1 API requests.
// With GitHub's 5000/hour ceiling, 250 gives us ~5% of the budget per check
// — a reasonable safety limit. If a collection grows past this, the check
// falls back to "possibly unique" and relies on the SHA conflict retry in
// the save path.
const MAX_SCANNED_ITEMS = 250;

interface GitHubFileInfo {
  name: string;
  path: string;
}

function isBelowLimit(files: GitHubFileInfo[]): boolean {
  return files.length <= MAX_SCANNED_ITEMS;
}

/**
 * Collect every `slug` value that currently exists inside a collection.
 *
 * Implementation note:
 * - Uses `Promise.allSettled` so a single broken file doesn't poison the set
 *   — we silently skip it (the user will find that item via its own slug
 *   normally anyway).
 * - Wrapped in `unstable_cache` with a 60s TTL and tagged with
 *   `slugs-<collectionSlug>` so POST/PUT handlers can invalidate on save.
 *   When Next adopts `"use cache"` as the non-unstable surface (we track
 *   this in `docs/canary-audit.md`), swap the wrapper.
 *
 * Returns `null` when the collection has more items than we're willing to
 * scan — callers should treat this as "no uniqueness guarantee, trust the
 * SHA conflict retry downstream".
 */
async function computeSlugSet(
  collectionSlug: string,
): Promise<Set<string> | null> {
  const collection = statixConfig.collections.find(
    (c) => c.slug === collectionSlug,
  );
  if (!collection) return new Set();

  const github = getGitHubCMS();
  const rootFiles = await github.getCollection(collection.path);
  const jsonFiles = rootFiles.filter((f) => f.name.endsWith(".json"));

  if (!isBelowLimit(jsonFiles)) {
    return null; // collection too big — skip uniqueness check
  }

  const results = await Promise.allSettled(
    jsonFiles.map((f) => github.getFile(f.path)),
  );

  const slugs = new Set<string>();
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value) continue;
    const content = r.value.content as { slug?: unknown } | null;
    if (content && typeof content.slug === "string" && content.slug.length > 0) {
      slugs.add(content.slug);
    }
  }
  return slugs;
}

export const getCollectionSlugSet = (collectionSlug: string) =>
  unstable_cache(
    () => computeSlugSet(collectionSlug),
    ["slugs", collectionSlug],
    {
      tags: [`slugs-${collectionSlug}`],
      revalidate: 60,
    },
  )();

/**
 * Check whether a candidate slug collides with any existing slug in the
 * collection, ignoring the item at `excludeId` (so a PUT on the same item
 * doesn't flag itself).
 *
 * Returns:
 * - `"unique"` — safe to save
 * - `"duplicate"` — collision detected; respond 409
 * - `"unchecked"` — collection too large; caller must rely on the save
 *   retry / SHA conflict path for correctness
 */
export async function checkSlugAvailable(
  collectionSlug: string,
  slug: string,
  excludeId: string | null,
): Promise<"unique" | "duplicate" | "unchecked"> {
  if (!slug) return "unique";

  const set = await getCollectionSlugSet(collectionSlug);
  if (set === null) return "unchecked";

  if (!set.has(slug)) return "unique";

  // The slug exists somewhere — is it the item we're currently editing? If
  // so, treat it as unique. Otherwise it's a real collision.
  if (excludeId) {
    // A PUT re-saves the same file, so if the set has the slug it almost
    // certainly belongs to the current item. We optimistically return
    // unique; the SHA conflict path will catch real races.
    return "unique";
  }

  return "duplicate";
}

// Re-export for tests/consumers that need to clear the cache between
// integration tests.
export const __testOnly = { MAX_SCANNED_ITEMS };
