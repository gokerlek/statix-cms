import { Activity, Database, GitBranch, Server } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SystemStats {
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
  };
  repoDetails: {
    size: number;
    open_issues: number;
  };
}

export function SystemHealth({ stats }: { stats: SystemStats }) {
  const rateLimitPercentage = Math.round(
    (stats.rateLimit.remaining / stats.rateLimit.limit) * 100,
  );

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Convert KB to Bytes for repo size (GitHub API returns size in KB)
  const repoSizeBytes = stats.repoDetails.size * 1024;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-4 w-4" /> API Rate Limit
            </span>

            <span className="font-medium">
              {stats.rateLimit.remaining} / {stats.rateLimit.limit}
            </span>
          </div>

          <Progress value={rateLimitPercentage} className="h-2" />

          <p className="text-xs text-muted-foreground text-right">
            Resets {new Date(stats.rateLimit.reset * 1000).toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-lg">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="h-3 w-3" /> Repo Size
            </span>

            <span className="text-xl font-bold">
              {formatBytes(repoSizeBytes)}
            </span>
          </div>

          <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-lg">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <GitBranch className="h-3 w-3" /> Open Issues
            </span>

            <span className="text-xl font-bold">
              {stats.repoDetails.open_issues}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
