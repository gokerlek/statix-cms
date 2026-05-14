"use client";

import Link from "next/link";

import {
  IconAlertCircle,
  IconClock,
  IconDeviceFloppy,
  IconFileDescription,
  IconFiles,
} from "@tabler/icons-react";

import { buttonVariants } from "@/statix/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/statix/components/ui/card";
import { Skeleton } from "@/statix/components/ui/skeleton";
import ui from "@/statix/content/ui.json";
import {
  type FileActivityStatus,
  type FileStatsActivity,
  useFilesStats,
} from "@/statix/hooks/use-files-stats";
import { ROUTES } from "@/statix/lib/constants";
import { getExtensionColor, getTypeIcon } from "@/statix/lib/file-icons";
import { cn, formatFileSize } from "@/statix/lib/utils";

/**
 * Dashboard widget for the File library. Visual + data parity with
 * `MediaOverview`:
 *  - Server-side aggregation via `/api/files/stats`
 *  - Total Storage + Orphaned stat tiles (same styling)
 *  - Top 5 extension list (with type-specific icon)
 *  - 6-slot recent-activity grid with live/orphaned/trash status badges
 *    surfaced on hover (same overlay treatment as media thumbs)
 */
export function FilesOverview() {
  const { data: stats, isLoading, error } = useFilesStats();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <OverviewHeader />
        <CardContent className="space-y-6 flex-1">
          <OverviewSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) return null;

  return (
    <Card className="h-full flex flex-col">
      <OverviewHeader />
      <CardContent className="space-y-6 flex-1">
        <FilesStatsGrid
          totalSize={stats.totalSize}
          orphanedCount={stats.orphanedCount}
        />
        <FileTypesSection typeDistribution={stats.typeDistribution} />
        <FilesRecentActivity latestUploads={stats.latestUploads} />
      </CardContent>
    </Card>
  );
}

// ── Header ──────────────────────────────────────────────────────────────
function OverviewHeader() {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <IconFiles className="h-5 w-5" />
        {ui.filesPage.title}
      </CardTitle>

      <Link
        href={ROUTES.ADMIN.FILES}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        {ui.common.viewAll}
      </Link>
    </CardHeader>
  );
}

// ── Stats (mirror of MediaOverview's `StatsGrid`) ───────────────────────
function FilesStatsGrid({
  totalSize,
  orphanedCount,
}: {
  totalSize: number;
  orphanedCount: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-lg">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <IconDeviceFloppy className="h-3 w-3" />
          {ui.filesOverview.totalStorage}
        </span>
        <span className="text-xl font-bold">{formatFileSize(totalSize)}</span>
      </div>

      <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-lg">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <IconAlertCircle className="h-3 w-3" />
          {ui.filesOverview.orphaned}
        </span>
        <span className="text-xl font-bold">
          {orphanedCount === null ? "-" : orphanedCount}
        </span>
      </div>
    </div>
  );
}

// ── Type distribution (mirror of MediaOverview's `FileTypes`) ───────────
function FileTypesSection({
  typeDistribution,
}: {
  typeDistribution: Record<string, number>;
}) {
  const sortedTypes = Object.entries(typeDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (sortedTypes.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <IconFileDescription className="h-4 w-4" />
        {ui.filesOverview.byType}
      </h4>

      <div className="space-y-2">
        {sortedTypes.map(([type, count]) => {
          const upper = type.toUpperCase();
          const Icon = getTypeIcon(upper);

          return (
            <div
              key={type}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 uppercase bg-secondary px-2 py-0.5 rounded text-xs font-medium">
                <Icon className={cn("h-4 w-4", getExtensionColor(upper))} />
                {type}
              </span>
              <span className="text-muted-foreground">
                {count} {ui.mediaOverview.files}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Recent grid (mirror of `MediaRecentActivity`) ───────────────────────
function FilesRecentActivity({
  latestUploads,
}: {
  latestUploads: FileStatsActivity[];
}) {
  if (latestUploads.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <IconClock className="h-4 w-4" />
        {ui.filesOverview.recent}
      </h4>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {latestUploads.map((activity) => {
          const ext = (activity.filename.split(".").pop() ?? "").toUpperCase();
          const Icon = getTypeIcon(ext);

          return (
            <div
              key={activity.sha}
              className="relative aspect-square rounded-md overflow-hidden border bg-muted group"
            >
              <div
                className={cn(
                  "w-full h-full flex flex-col items-center justify-center p-2 text-center bg-secondary/50",
                  activity.status === "trash" && "opacity-50 grayscale",
                )}
              >
                <Icon className={cn("h-8 w-8 mb-1", getExtensionColor(ext))} />
                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2 break-all">
                  {activity.filename}
                </span>
              </div>

              {/* Status Overlay — same hover treatment as MediaRecentActivity */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                <span className="text-xs text-white font-medium truncate w-full">
                  {activity.filename}
                </span>
                <StatusBadge status={activity.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: FileActivityStatus }) {
  const color =
    status === "live"
      ? "bg-green-500/80"
      : status === "orphaned"
        ? "bg-amber-500/80"
        : status === "trash"
          ? "bg-orange-500/80"
          : "bg-red-500/80";
  const label =
    status === "live"
      ? ui.mediaOverview.activityStatus.live
      : status === "orphaned"
        ? ui.filesOverview.statusOrphaned
        : status === "trash"
          ? ui.mediaOverview.activityStatus.inTrash
          : ui.mediaOverview.activityStatus.deleted;

  return (
    <span
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded-full mt-1 text-white",
        color,
      )}
    >
      {label}
    </span>
  );
}

function OverviewSkeleton() {
  return (
    <>
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
    </>
  );
}
