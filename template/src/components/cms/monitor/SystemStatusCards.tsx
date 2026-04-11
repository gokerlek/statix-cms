"use client";

import { IconDatabase, IconServer } from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ui from "@/content/ui.json";

interface SystemStatusCardsProps {
  rateLimit: { limit: number; remaining: number; reset: number };
  repoSize: number;
}

function formatRepoSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function SystemStatusCards({ rateLimit, repoSize }: SystemStatusCardsProps) {
  const rateLimitPct = Math.round((rateLimit.remaining / rateLimit.limit) * 100);
  const resetTime = new Date(rateLimit.reset * 1000).toLocaleTimeString();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <IconServer className="h-4 w-4" />
            {ui.monitor.systemStatus.rateLimit}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold">{rateLimit.remaining.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">/ {rateLimit.limit.toLocaleString()}</span>
          </div>
          <Progress value={rateLimitPct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {ui.monitor.systemStatus.resetsAt.replace("{time}", resetTime)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <IconDatabase className="h-4 w-4" />
            {ui.monitor.systemStatus.repoSize}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-4xl font-bold">{formatRepoSize(repoSize)}</span>
          <p className="text-xs text-muted-foreground mt-2">
            {ui.monitor.systemStatus.repoSizeLabel}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
