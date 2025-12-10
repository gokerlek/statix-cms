import { Skeleton } from "@/components/ui/skeleton";

interface CollectionListSkeletonProps {
  rows?: number;
}

/**
 * Skeleton loader for CollectionList table
 */
export function CollectionListSkeleton({
  rows = 5,
}: CollectionListSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Tabs and Search skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <Skeleton className="h-10 w-full sm:w-64" />

        <Skeleton className="h-10 w-full sm:w-64" />
      </div>

      {/* Table skeleton */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-6 py-4">
                <Skeleton className="h-4 w-16" />
              </th>

              <th className="text-left px-6 py-4">
                <Skeleton className="h-4 w-16" />
              </th>

              <th className="text-right px-6 py-4">
                <Skeleton className="h-4 w-16 ml-auto" />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <Skeleton className="h-5 w-48" />
                </td>

                <td className="px-6 py-4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />

                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
