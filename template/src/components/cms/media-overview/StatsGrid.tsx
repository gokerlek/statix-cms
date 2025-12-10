import { AlertCircle, HardDrive } from "lucide-react";

import ui from "@/content/ui.json";

interface StatsGridProps {
  totalSize: number;
  orphanedCount: number | null;
}

export function StatsGrid({ totalSize, orphanedCount }: StatsGridProps) {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-lg">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <HardDrive className="h-3 w-3" /> {ui.mediaOverview.totalStorage}
        </span>

        <span className="text-xl font-bold">{formatBytes(totalSize)}</span>
      </div>

      <div className="flex flex-col gap-1 p-3 bg-secondary/50 rounded-lg">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {ui.mediaOverview.orphaned}
        </span>

        <span className="text-xl font-bold">
          {orphanedCount === null ? "-" : orphanedCount}
        </span>
      </div>
    </div>
  );
}
