"use client";

import { useQuery } from "@tanstack/react-query";

interface MediaReference {
  path: string;
  title: string;
  collection: string;
}

export function useMediaReferences(filename: string | null) {
  return useQuery<MediaReference[]>({
    queryKey: ["media-references", filename],
    queryFn: async () => {
      if (!filename) return [];

      const response = await fetch(
        `/api/media/references?filename=${encodeURIComponent(filename)}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch references");
      }

      return response.json();
    },
    enabled: !!filename,
  });
}
