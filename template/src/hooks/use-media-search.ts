import { useMemo } from "react";

import ui from "@/content/ui.json";
import { GitHubFile } from "@/lib/github-cms";
import { statixConfig } from "@/statix.config";

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
        count: images.filter((img) => img.path.split("/").length <= 3).length,
      },
    ];

    // Add collection tabs
    statixConfig.collections.forEach((collection) => {
      const count = images.filter(
        (img) =>
          img.path.includes(`/media/${collection.slug}/`) ||
          img.path.includes(`/${collection.slug}/`),
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
      tabFiltered = images.filter((img) => img.path.split("/").length <= 3);
    } else if (activeTab === "orphaned") {
      tabFiltered = images.filter((img) => img.isOrphaned);
    } else if (activeTab !== "all") {
      // Collection tab
      tabFiltered = images.filter(
        (img) =>
          img.path.includes(`/media/${activeTab}/`) ||
          img.path.includes(`/${activeTab}/`),
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
  const groupedImages = useMemo(() => {
    return filteredImages.reduce(
      (acc, img) => {
        const parts = img.path.split("/");
        let folder = "Default";

        if (parts.length > 3) {
          folder = parts[2];
        }

        if (!acc[folder]) acc[folder] = [];

        acc[folder].push(img);

        return acc;
      },
      {} as Record<string, GitHubFile[]>,
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
