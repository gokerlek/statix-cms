"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/statix/components/ui/button";
import { CMSSearch } from "@/statix/components/shared/CMSSearch";
import { cn } from "@/statix/lib/utils";
import type { UnifiedActivityItem } from "@/statix/lib/activity-feed";
import { useActivity } from "@/statix/hooks/use-activity";
import { UnifiedFeedItem } from "./UnifiedFeedItem";

interface UnifiedFeedProps {
  initialItems: UnifiedActivityItem[];
  initialCursor: string | null;
  scrollable?: boolean;
}

type SourceFilter = "all" | "github" | "audit";

export function UnifiedFeed({ initialItems, initialCursor, scrollable }: UnifiedFeedProps) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivity({
    initialItems,
    initialCursor,
  });

  // Infinite scroll — trigger fetchNextPage when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const items = data?.pages.flatMap((p) => p.items) ?? initialItems;

  const filtered = items.filter((item) => {
    if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (item.actorName ?? "").toLowerCase().includes(q) ||
      (item.actorEmail ?? "").toLowerCase().includes(q) ||
      (item.actionLabel ?? "").toLowerCase().includes(q) ||
      (item.collectionLabel ?? "").toLowerCase().includes(q) ||
      (item.detail ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">


        <div className="flex items-center gap-1">
          {(["all", "github", "audit"] as SourceFilter[]).map((s) => (
            <Button
              key={s}
              variant={sourceFilter === s ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSourceFilter(s)}
            >
              {s === "all" ? "All" : s === "github" ? "GitHub" : "Audit Log"}
            </Button>
          ))}
        </div>
        <CMSSearch
            placeholder="Search by actor, action, collection…"
            value={search}
            onChange={setSearch}
            className="max-w-xs"
        />

      </div>

      {/* Feed */}
      <div
        className={cn("space-y-2", {
          "overflow-y-auto h-120 pr-1": scrollable,
        })}
      >
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No activity found.
          </div>
        ) : (
          filtered.map((item) => <UnifiedFeedItem key={item.id} item={item} />)
        )}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-1">
        {isFetchingNextPage && (
          <p className="text-center text-xs text-muted-foreground animate-pulse">
            Loading…
          </p>
        )}
      </div>
    </div>
  );
}
