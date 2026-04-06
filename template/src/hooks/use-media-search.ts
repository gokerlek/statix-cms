import { useMemo } from "react";

import ui from "@/content/ui.json";
import { statixConfig } from "@/statix.config";
import type { MediaFile } from "./use-media";

import { useMedia } from "./use-media";

export type MediaTab = "all" | "uncategorized" | string; // string for collection slugs

interface UseMediaSearchOptions {
  searchQuery?: string;
  activeTab?: MediaTab;
}

export function useMediaSearch({
  searchQuery = "",
  activeTab = "all",
}: UseMediaSearchOptions = {}) {
  const { data: images = [], isLoading: loading } = useMedia();

  // Get available tabs based on collections and images
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
        // uploads/filename.jpg → 2 parça = root (uncategorized)
        count: images.filter((img) => img.path.split("/").length === 2).length,
      },
    ];

    // Add collection tabs
    statixConfig.collections.forEach((collection) => {
      // R2 path: uploads/{collection.slug}/filename.jpg
      const count = images.filter((img) =>
        img.path.startsWith(`uploads/${collection.slug}/`),
      ).length;

      if (count > 0) {
        tabs.push({
          id: collection.slug,
          label: collection.label,
          count: count,
        });
      }
    });

    return tabs;
  }, [images]);

  // Filter images based on active tab and search query
  const filteredImages = useMemo(() => {
    let tabFiltered = images;

    // Filter by tab
    if (activeTab === "uncategorized") {
      tabFiltered = images.filter((img) => img.path.split("/").length === 2);
    } else if (activeTab === "orphaned") {
      tabFiltered = images.filter((img) => img.isOrphaned);
    } else if (activeTab !== "all") {
      // Collection tab: uploads/{activeTab}/filename
      tabFiltered = images.filter((img) =>
        img.path.startsWith(`uploads/${activeTab}/`),
      );
    }

    // Filter by search query
    if (searchQuery) {
      tabFiltered = tabFiltered.filter((img) =>
        img.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return tabFiltered;
  }, [images, activeTab, searchQuery]);

  // Group filtered images by folder
  // R2 key: uploads/filename.jpg veya uploads/folder/filename.jpg
  const groupedImages = useMemo(() => {
    return filteredImages.reduce(
      (acc, img) => {
        const parts = img.path.split("/");
        // parts[0] = "uploads", parts[1] = folder veya filename
        let folder = "Default";

        if (parts.length > 2) {
          // uploads/folder/filename → folder = parts[1]
          folder = parts[1];
        }

        if (!acc[folder]) acc[folder] = [];

        acc[folder].push(img);

        return acc;
      },
      {} as Record<string, MediaFile[]>,
    );
  }, [filteredImages]);

  return {
    images: filteredImages,
    groupedImages,
    loading,
    totalCount: images.length,
    filteredCount: filteredImages.length,
    availableTabs,
    allImages: images,
  };
}
