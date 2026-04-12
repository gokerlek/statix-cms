import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Top row: Profile + Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Collection cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="row-span-2">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-48 w-48 rounded-full mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Singleton cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
