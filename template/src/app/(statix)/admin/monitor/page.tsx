import { ActivityTrendChart } from "@/statix/components/monitor/ActivityTrendChart";
import { CollectionCountsCard } from "@/statix/components/monitor/CollectionCountsCard";
import { TopUsersCard } from "@/statix/components/monitor/TopUsersCard";
import { SystemStatusCards } from "@/statix/components/monitor/SystemStatusCards";
import { CMSCard } from "@/statix/components/shared/CMSCard";
import { UnifiedFeed } from "@/statix/components/activity/UnifiedFeed";
import ui from "@/statix/content/ui.json";
import {
  getActivityByUser,
  getActivityTrend,
  getContentChangesByCollection,
  getSystemStatus,
} from "@/statix/lib/monitor-data";
import { getUnifiedActivity } from "@/statix/lib/activity-feed";
import { requirePermissionOrRedirect } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

export default async function MonitorPage() {
  await requirePermissionOrRedirect(P.VIEW_MONITOR);

  const [
    systemStatus,
    activityByUser,
    activityTrend,
    collectionCounts,
    { items: activityItems, nextCursor },
  ] = await Promise.all([
    getSystemStatus(),
    getActivityByUser(30),
    getActivityTrend(30),
    getContentChangesByCollection(),
    getUnifiedActivity({ limit: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{ui.monitor.title}</h1>
        <p className="text-muted-foreground text-sm">{ui.monitor.subtitle}</p>
      </div>

      {/* Row 1: Status cards */}
      <SystemStatusCards
        rateLimit={systemStatus.rateLimit}
        repoSize={systemStatus.repoDetails.size}
      />

      {/* Row 2: Trend + Top Users + Collection Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CMSCard
          title={ui.monitor.activityTrend.title}
          description={ui.monitor.activityTrend.subtitle}
          className="**:data-[slot=card-title]:text-sm **:data-[slot=card-title]:font-medium"
        >
          <ActivityTrendChart data={activityTrend} />
        </CMSCard>

        <CMSCard
          title={ui.monitor.topUsers.title}
          description={ui.monitor.topUsers.subtitle}
          className="**:data-[slot=card-title]:text-sm **:data-[slot=card-title]:font-medium"
        >
          <TopUsersCard data={activityByUser} />
        </CMSCard>

        <CMSCard
          title={ui.monitor.collectionCounts.title}
          description={ui.monitor.collectionCounts.subtitle}
          className="**:data-[slot=card-title]:text-sm **:data-[slot=card-title]:font-medium"
        >
          <CollectionCountsCard data={collectionCounts} />
        </CMSCard>
      </div>

      {/* Row 3: Unified Activity Feed */}
      <CMSCard
        title={ui.dashboard.stats.recentActivity}
        description={ui.monitor.auditFeed.subtitle}
        className="**:data-[slot=card-title]:text-sm **:data-[slot=card-title]:font-medium"
        contentClassName="pt-2"
      >
        <UnifiedFeed
          initialItems={activityItems}
          initialCursor={nextCursor}
          scrollable
        />
      </CMSCard>
    </div>
  );
}
