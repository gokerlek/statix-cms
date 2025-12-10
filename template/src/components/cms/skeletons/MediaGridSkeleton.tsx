import { Skeleton } from "@/components/ui/skeleton";

interface MediaGridSkeletonProps {
  items?: number;
}

/**
 * Skeleton loader for MediaGrid
 */
export function MediaGridSkeleton({ items = 12 }: MediaGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square rounded-lg" />

          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}
