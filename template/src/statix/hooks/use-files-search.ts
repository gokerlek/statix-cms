import { useMemo } from "react";

import { statixConfig } from "@/statix.config";
import ui from "@/statix/content/ui.json";
import { type FileItem, useFiles } from "@/statix/hooks/use-files";
import { type MediaFile } from "@/statix/hooks/use-media";

export type FileTab = "all" | "orphaned" | "uncategorized" | string;

interface UseFilesSearchOptions {
  searchQuery?: string;
  activeTab?: FileTab;
}

/**
 * Adapt a `FileItem` (R2 files bucket shape) into the `MediaFile`
 * shape `MediaItem` / `MediaGrid` already understand. Lets the
 * exact same components render either bucket without forking
 * implementations.
 */
function toMediaFile(item: FileItem): MediaFile {
  return {
    name: item.name,
    path: item.key,
    sha: item.key, // files have no GitHub sha; reuse the R2 key
    size: item.size,
    type: "file",
    url: item.url,
    isOrphaned: item.isOrphaned,
    lastModified: item.lastModified,
  };
}

/**
 * File-library equivalent of `useMediaSearch`. Returns the same shape
 * (`images`, `groupedImages`, `availableTabs`, `totalCount`,
 * `filteredCount`, `hasNextPage`, `isFetchingNextPage`,
 * `fetchNextPage`) so `MediaLibrary` FilesShell can plug into the
 * same `MediaToolbar` + `MediaGrid` pipeline.
 *
 * Tabs / filtering / grouping mirror the media equivalents:
 *  - `uncategorized`: items at the bucket root (`files/foo.pdf`)
 *  - `orphaned`: items not referenced anywhere in content JSON
 *  - collection slug: items under `files/{slug}/...`
 *
 * Grouping is by folder ("Default" for root, otherwise the path
 * segment between the bucket prefix and the filename) — same shape
 * `useMediaSearch` produces, so the grid renders identically.
 */
export function useFilesSearch({
  searchQuery = "",
  activeTab = "all",
}: UseFilesSearchOptions = {}) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useFiles();

  const images = useMemo<MediaFile[]>(
    () => data?.pages.flatMap((p) => p.items.map(toMediaFile)) ?? [],
    [data],
  );

  // Tabs — All + Orphaned + Uncategorized + collection slugs (count>0).
  const availableTabs = useMemo(() => {
    const tabs = [
      { id: "all", label: ui.mediaLibrary.all, count: images.length },
      {
        id: "orphaned",
        label: ui.mediaLibrary.orphaned,
        count: images.filter((img) => img.isOrphaned).length,
      },
      {
        id: "uncategorized",
        label: ui.mediaLibrary.uncategorized,
        // files/foo.pdf → 2 segments = root (uncategorized)
        count: images.filter((img) => img.path.split("/").length === 2).length,
      },
    ];

    statixConfig.collections.forEach((collection) => {
      const count = images.filter((img) =>
        img.path.startsWith(`files/${collection.slug}/`),
      ).length;

      if (count > 0) {
        tabs.push({
          id: collection.slug,
          label: collection.label,
          count,
        });
      }
    });

    return tabs;
  }, [images]);

  // Filter by tab + search.
  const filteredImages = useMemo(() => {
    let tabFiltered = images;

    if (activeTab === "uncategorized") {
      tabFiltered = images.filter((img) => img.path.split("/").length === 2);
    } else if (activeTab === "orphaned") {
      tabFiltered = images.filter((img) => img.isOrphaned);
    } else if (activeTab !== "all") {
      tabFiltered = images.filter((img) =>
        img.path.startsWith(`files/${activeTab}/`),
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();

      tabFiltered = tabFiltered.filter((img) =>
        img.name.toLowerCase().includes(q),
      );
    }

    return tabFiltered;
  }, [images, activeTab, searchQuery]);

  // Group by folder. R2 key: `files/foo.pdf` (root) or
  // `files/{folder}/foo.pdf`. Root → "Default", otherwise the segment.
  const groupedImages = useMemo(() => {
    return filteredImages.reduce(
      (acc, img) => {
        const parts = img.path.split("/");
        const folder = parts.length > 2 ? parts[1] : "Default";

        if (!acc[folder]) acc[folder] = [];

        acc[folder].push(img);

        return acc;
      },
      {} as Record<string, MediaFile[]>,
    );
  }, [filteredImages]);

  return {
    images: filteredImages,
    allImages: images,
    groupedImages,
    loading: isLoading,
    totalCount: images.length,
    filteredCount: filteredImages.length,
    availableTabs,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
}
