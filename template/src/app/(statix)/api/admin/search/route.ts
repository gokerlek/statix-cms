import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/statix/lib/api-response";
import { getGitHubCMS } from "@/statix/lib/github-cms";
import {
  getSession,
  getUserPermissions,
} from "@/statix/lib/session";
import { statixConfig } from "@/statix.config";
import {
  CP,
  hasCollectionPermission,
} from "@/statix/types/permissions";

interface SearchHit {
  collection: string;
  collectionLabel: string;
  id: string;
  title: string;
  slug?: string;
  status?: string;
  /** 0 = exact match, higher = weaker match; used for ranking. */
  score: number;
}

interface SearchResponse {
  query: string;
  results: SearchHit[];
  truncated: boolean;
}

/** Max items scanned per collection before we short-circuit with `truncated`. */
const MAX_PER_COLLECTION = 250;
/** Max hits returned to the client — the palette paginates above this. */
const MAX_RESULTS = 40;

function scoreMatch(haystack: string, needle: string): number {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 0; // exact
  if (h.startsWith(n)) return 1; // prefix
  const idx = h.indexOf(n);
  if (idx === -1) return -1; // no match
  return 2 + idx; // substring — later matches rank worse
}

/**
 * ⌘K global search across every collection the caller can view. Implementation
 * is deliberately simple (in-memory substring match after a GitHub fetch) —
 * good enough for a ≤250-item-per-collection workspace. Larger installs will
 * want to move to `git trees` API or an external index; see
 * `docs/canary-audit.md` §3 for the roadmap.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) {
      const empty: SearchResponse = { query: "", results: [], truncated: false };
      return NextResponse.json(empty);
    }

    const github = getGitHubCMS();
    const userPerms = await getUserPermissions(session.user.id);
    const defaultLocale = statixConfig.i18n?.defaultLocale ?? "en";

    let truncated = false;
    const hits: SearchHit[] = [];

    // Filter collections the user can VIEW; skip singletons (they surface via
    // their dedicated sidebar entry).
    const visibleCollections = statixConfig.collections.filter((c) => {
      if (c.type === "singleton") return false;
      return hasCollectionPermission(userPerms, c.slug, CP.VIEW);
    });

    for (const collection of visibleCollections) {
      const files = await github.getCollection(collection.path);
      const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

      if (jsonFiles.length > MAX_PER_COLLECTION) {
        truncated = true;
        // Keep going — partial results across small collections are still
        // useful even if one big collection is skipped.
        continue;
      }

      const results = await Promise.allSettled(
        jsonFiles.map((f) => github.getFile(f.path)),
      );

      results.forEach((r, idx) => {
        if (r.status !== "fulfilled" || !r.value) return;
        const raw = r.value.content as Record<string, unknown>;
        if (!raw) return;

        const id =
          typeof raw.id === "string"
            ? raw.id
            : jsonFiles[idx]!.name.replace(/\.json$/, "");

        // Title resolution mirrors the relation endpoint: check root first,
        // then fall back to `translations.<defaultLocale>` so localized
        // content still surfaces with a readable title instead of its UUID.
        const translations = raw.translations as
          | Record<string, Record<string, unknown>>
          | undefined;
        const localized = translations?.[defaultLocale];
        const pickString = (src: Record<string, unknown> | undefined, key: string) => {
          const v = src?.[key];
          return typeof v === "string" && v.trim().length > 0 ? v : undefined;
        };
        const title =
          pickString(raw, "title") ||
          pickString(raw, "name") ||
          pickString(raw, "label") ||
          pickString(localized, "title") ||
          pickString(localized, "name") ||
          pickString(localized, "label") ||
          pickString(raw, "slug") ||
          id;

        const slug = typeof raw.slug === "string" ? raw.slug : undefined;
        const status = typeof raw.status === "string" ? raw.status : undefined;

        // Check against title + slug + id — whichever matches best wins.
        const candidates = [title, slug, id].filter(
          (s): s is string => typeof s === "string" && s.length > 0,
        );

        let best = -1;
        for (const c of candidates) {
          const s = scoreMatch(c, q);
          if (s !== -1 && (best === -1 || s < best)) best = s;
        }

        if (best !== -1) {
          hits.push({
            collection: collection.slug,
            collectionLabel: collection.label,
            id,
            title,
            slug,
            status,
            score: best,
          });
        }
      });
    }

    hits.sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));

    const body: SearchResponse = {
      query: q,
      results: hits.slice(0, MAX_RESULTS),
      truncated: truncated || hits.length > MAX_RESULTS,
    };

    return NextResponse.json(body);
  } catch (error) {
    return handleApiError(error, "Search failed");
  }
}
