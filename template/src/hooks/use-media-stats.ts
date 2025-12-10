import { useQuery } from "@tanstack/react-query";

interface ActivityItem {
  sha: string;
  url?: string;
  filename: string;
  status: "live" | "trash" | "restored" | "deleted";
}

interface MediaStats {
  count: number;
  totalSize: number;
  typeDistribution: Record<string, number>;
  latestUploads: ActivityItem[];
  orphanedCount: number | null;
}

async function fetchMediaStats(): Promise<MediaStats> {
  const response = await fetch("/api/media/stats");

  if (!response.ok) {
    throw new Error("Failed to fetch media stats");
  }

  return response.json();
}

export function useMediaStats() {
  return useQuery({
    queryKey: ["media", "stats"],
    queryFn: fetchMediaStats,
  });
}
