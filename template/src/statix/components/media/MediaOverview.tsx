"use client";

import { Card, CardContent } from "@/statix/components/ui/card";
import { Skeleton } from "@/statix/components/ui/skeleton";
import { useMediaStats } from "@/statix/hooks/use-media-stats";

import { FileTypes } from "./overview/FileTypes";
import { Header } from "./overview/Header";
import { MediaRecentActivity } from "./overview/MediaRecentActivity";
import { StatsGrid } from "./overview/StatsGrid";

export function MediaOverview() {
  const { data: stats, isLoading, error } = useMediaStats();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <Header />

        <CardContent className="space-y-6 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />

            <Skeleton className="h-20 w-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />

            <div className="space-y-2">
              <Skeleton className="h-6 w-full" />

              <Skeleton className="h-6 w-full" />

              <Skeleton className="h-6 w-full" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />

            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return null; // Or render an error state
  }

  return (
    <Card className="h-full flex flex-col">
      <Header />

      <CardContent className="space-y-6 flex-1">
        <StatsGrid
          totalSize={stats.totalSize}
          orphanedCount={stats.orphanedCount}
        />

        <FileTypes typeDistribution={stats.typeDistribution} />

        <MediaRecentActivity latestUploads={stats.latestUploads} />
      </CardContent>
    </Card>
  );
}
