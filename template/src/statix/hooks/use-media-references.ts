"use client";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/statix/lib/query-keys";

interface MediaReference {
  path: string;
  title: string;
  collection: string;
}

export function useMediaReferences(filename: string | null) {
  return useQuery<MediaReference[]>({
    queryKey: QUERY_KEYS.mediaReferences(filename ?? ""),
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
