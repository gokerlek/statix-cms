import { DetailedRecentActivity } from "@/components/cms/DetailedRecentActivity";
import ui from "@/content/ui.json";
import { getAllRecentActivity } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activities = (await getAllRecentActivity(100)) as any[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {ui.dashboard.stats.recentActivity}
        </h1>

        <p className="text-muted-foreground">
          {ui.mediaOverview.recentActivity}
        </p>
      </div>

      <DetailedRecentActivity activities={activities} />
    </div>
  );
}
