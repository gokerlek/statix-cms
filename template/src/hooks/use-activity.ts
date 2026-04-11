import { useInfiniteQuery } from "@tanstack/react-query";

import type { UnifiedActivityItem } from "@/lib/activity-feed";

interface ActivityPage {
  items: UnifiedActivityItem[];
  nextCursor: string | null;
}

async function fetchActivityPage(cursor?: string): Promise<ActivityPage> {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/admin/activity?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch activity");

  const data = (await res.json()) as ActivityPage;

  // Deserialize timestamps (JSON sends them as strings)
  return {
    ...data,
    items: data.items.map((i) => ({ ...i, timestamp: new Date(i.timestamp) })),
  };
}

export const ACTIVITY_QUERY_KEY = ["activity"] as const;

interface UseActivityOptions {
  initialItems: UnifiedActivityItem[];
  initialCursor: string | null;
}

export function useActivity({ initialItems, initialCursor }: UseActivityOptions) {
  return useInfiniteQuery<ActivityPage>({
    queryKey: ACTIVITY_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchActivityPage(pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined,
    initialData: {
      pages: [{ items: initialItems, nextCursor: initialCursor }],
      pageParams: [undefined],
    },
    staleTime: 30_000,
  });
}
