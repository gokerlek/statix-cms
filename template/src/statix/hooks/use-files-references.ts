"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/statix/lib/query-keys";

interface FileReference {
  path: string;
  title: string;
  collection: string;
}

/**
 * Fetches the list of content JSONs that reference a given file
 * (by R2 key). Mirror of `useMediaReferences` for the files bucket.
 */
export function useFilesReferences(key: string | null) {
  return useQuery<FileReference[]>({
    queryKey: QUERY_KEYS.fileReferences(key ?? ""),
    queryFn: async () => {
      if (!key) return [];

      const response = await fetch(
        `/api/files/references?key=${encodeURIComponent(key)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch references");
      }

      return response.json();
    },
    enabled: !!key,
  });
}
