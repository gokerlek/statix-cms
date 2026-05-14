import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/statix/lib/query-keys";

export type FileActivityStatus = "live" | "orphaned" | "trash" | "deleted";

export interface FileStatsActivity {
  sha: string;
  key: string;
  filename: string;
  status: FileActivityStatus;
  url: string;
  size: number;
}

export interface FileStats {
  count: number;
  totalSize: number;
  typeDistribution: Record<string, number>;
  latestUploads: FileStatsActivity[];
  orphanedCount: number | null;
  trashCount: number;
}

async function fetchFileStats(): Promise<FileStats> {
  const res = await fetch("/api/files/stats");
  if (!res.ok) throw new Error("Failed to load file stats");
  return res.json();
}

/**
 * Dashboard-side stats for the File library — mirror of `useMediaStats`.
 * Used by `FilesOverview` to render orphan counts and the recent-activity
 * grid with correct status badges. Separate query key from `useFiles` so
 * the lightweight dashboard call doesn't collide with the full library
 * list in `/admin/files`.
 */
export function useFilesStats() {
  return useQuery({
    queryKey: [...QUERY_KEYS.files, "stats"],
    queryFn: fetchFileStats,
    staleTime: 60_000,
  });
}
