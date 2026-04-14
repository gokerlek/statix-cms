import { Card, CardContent } from "@/statix/components/ui/card";
import { Skeleton } from "@/statix/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <Skeleton className="h-4 w-64" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Shared fields */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>

      {/* Localized content */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-8 w-12" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
