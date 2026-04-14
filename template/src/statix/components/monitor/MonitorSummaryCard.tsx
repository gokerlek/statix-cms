import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import { IconActivity, IconDatabase, IconServer } from "@tabler/icons-react";

import { buttonVariants } from "@/statix/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/statix/components/ui/card";
import { Progress } from "@/statix/components/ui/progress";
import ui from "@/statix/content/ui.json";
import { MonitorSummary } from "@/statix/lib/monitor-data";
import { cn } from "@/statix/lib/utils";

interface MonitorSummaryCardProps {
  summary: MonitorSummary;
}

function formatRepoSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function MonitorSummaryCard({ summary }: MonitorSummaryCardProps) {
  const rateLimitPct = Math.round(
    (summary.rateLimit.remaining / summary.rateLimit.limit) * 100,
  );

  return (
    <Card className="flex flex-col h-full gap-4">
      <CardHeader >
        <CardTitle className="flex items-center gap-2">
          <IconActivity className="size-5" />
          {ui.monitor.summaryCard.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground">{ui.monitor.summaryCard.today} {ui.monitor.summaryCard.actions}</p>
            <p className="text-xl font-bold">{summary.todayActionCount}</p>
          </div>

          <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <IconDatabase className="h-3 w-3" /> {ui.monitor.summaryCard.repoSize}
            </p>
            <p className="text-xl font-bold text-center">{formatRepoSize(summary.repoSize)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <IconServer className="h-3 w-3" /> {ui.monitor.summaryCard.githubApi}
            </span>
            <span className="font-medium">
              {summary.rateLimit.remaining.toLocaleString()} / {summary.rateLimit.limit.toLocaleString()}
            </span>
          </div>
          <Progress value={rateLimitPct} className="h-1.5" />
        {summary.lastLoginAt && (
          <p className="text-xs text-muted-foreground">
            {ui.monitor.summaryCard.lastLogin} {formatDistanceToNow(new Date(summary.lastLoginAt), { addSuffix: true })}
          </p>
        )}
        </div>

      </CardContent>

      <CardFooter>
          <Link href="/admin/monitor" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            {ui.monitor.summaryCard.goToMonitor}
          </Link>
      </CardFooter>
    </Card>
  );
}
