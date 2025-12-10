import { Clock, Image as ImageIcon } from "lucide-react";

import ui from "@/content/ui.json";

interface ActivityItem {
  sha: string;
  url?: string;
  filename: string;
  status: "live" | "trash" | "restored" | "deleted";
}

interface RecentActivityProps {
  latestUploads: ActivityItem[];
}

export function MediaRecentActivity({ latestUploads }: RecentActivityProps) {
  if (!latestUploads || latestUploads.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <Clock className="h-4 w-4" /> {ui.mediaOverview.recentActivity}
      </h4>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {latestUploads.map((activity) => (
          <div
            key={activity.sha}
            className="relative aspect-square rounded-md overflow-hidden border bg-muted group"
          >
            {activity.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activity.url}
                alt={activity.filename}
                className={`w-full h-full object-cover transition-opacity ${
                  activity.status === "trash" ? "opacity-50 grayscale" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-secondary/50">
                <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />

                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                  {activity.filename}
                </span>
              </div>
            )}

            {/* Status Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
              <span className="text-xs text-white font-medium truncate w-full">
                {activity.filename}
              </span>

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 ${
                  activity.status === "live"
                    ? "bg-green-500/80 text-white"
                    : activity.status === "trash"
                      ? "bg-orange-500/80 text-white"
                      : activity.status === "restored"
                        ? "bg-blue-500/80 text-white"
                        : "bg-red-500/80 text-white"
                }`}
              >
                {activity.status === "live"
                  ? ui.mediaOverview.activityStatus.live
                  : activity.status === "trash"
                    ? ui.mediaOverview.activityStatus.inTrash
                    : activity.status === "restored"
                      ? ui.mediaOverview.activityStatus.restored
                      : ui.mediaOverview.activityStatus.deleted}
              </span>
            </div>

            {/* Permanent Delete Indicator (if no image shown and strictly deleted) */}
            {!activity.url && activity.status === "deleted" && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-500/10 text-red-500 text-[10px] text-center py-0.5">
                {ui.mediaOverview.activityStatus.permanentlyDeleted}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
