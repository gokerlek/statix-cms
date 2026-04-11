import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTrendChart } from "@/components/cms/monitor/ActivityTrendChart";
import { CollectionCountsCard } from "@/components/cms/monitor/CollectionCountsCard";
import { TopUsersCard } from "@/components/cms/monitor/TopUsersCard";
import { SystemStatusCards } from "@/components/cms/monitor/SystemStatusCards";
import { UnifiedFeed } from "@/components/cms/activity/UnifiedFeed";
import ui from "@/content/ui.json";
import {
  getActivityByUser,
  getActivityTrend,
  getContentChangesByCollection,
  getSystemStatus,
} from "@/lib/monitor-data";
import { getUnifiedActivity } from "@/lib/activity-feed";
import { requireAdminOrRedirect } from "@/lib/session";

export default async function MonitorPage() {
  await requireAdminOrRedirect();

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{ui.monitor.activityTrend.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{ui.monitor.activityTrend.subtitle}</p>
          </CardHeader>
          <CardContent>
            <ActivityTrendChart data={activityTrend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{ui.monitor.topUsers.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{ui.monitor.topUsers.subtitle}</p>
          </CardHeader>
          <CardContent>
            <TopUsersCard data={activityByUser} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{ui.monitor.collectionCounts.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{ui.monitor.collectionCounts.subtitle}</p>
          </CardHeader>
          <CardContent>
            <CollectionCountsCard data={collectionCounts} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Unified Activity Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{ui.dashboard.stats.recentActivity}</CardTitle>
          <p className="text-xs text-muted-foreground">{ui.monitor.auditFeed.subtitle}</p>
        </CardHeader>
        <CardContent className="pt-2">
          <UnifiedFeed
            initialItems={activityItems}
            initialCursor={nextCursor}
            scrollable
          />
        </CardContent>
      </Card>
    </div>
  );
}
