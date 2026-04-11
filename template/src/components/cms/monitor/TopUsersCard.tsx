import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/cms/shared/EmptyState";
import { UserAvatar } from "@/components/cms/shared/UserAvatar";
import type { ActivityByUser } from "@/lib/monitor-data";

interface TopUsersCardProps {
  data: ActivityByUser[];
}

export function TopUsersCard({ data }: TopUsersCardProps) {
  const top = data.slice(0, 3);

  if (top.length === 0) return <EmptyState message="No activity yet." />;

  return (
    <div className="space-y-2">
      {top.map((row, i) => (
        <Card key={row.userEmail} className="gap-0 py-0 rounded-lg">
          <CardContent className="flex items-center gap-3 p-3">
            {/* Rank */}
            <span className="text-xs text-muted-foreground/50 w-4 shrink-0 text-right">
              {i + 1}
            </span>

            {/* Avatar */}
            <UserAvatar
              src={row.userAvatar}
              name={row.userName}
              email={row.userEmail}
              className="h-8 w-8 shrink-0"
            />

            {/* Name / email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {row.userName ?? row.userEmail.split("@")[0]}
              </p>
              {row.userName && (
                <p className="text-xs text-muted-foreground truncate">
                  {row.userEmail}
                </p>
              )}
            </div>

            {/* Count */}
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {row.count}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
