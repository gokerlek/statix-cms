import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLogTab } from "@/components/cms/AuditLogTab";
import { DetailedRecentActivity } from "@/components/cms/DetailedRecentActivity";
import type { Activity } from "@/components/cms/ActivityItem";
import ui from "@/content/ui.json";
import { getAllRecentActivity } from "@/lib/dashboard-data";
import { requireAdminOrRedirect } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  await requireAdminOrRedirect();

  const activities = (await getAllRecentActivity(100)) as Activity[];

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

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">İçerik Aktivitesi</TabsTrigger>
          <TabsTrigger value="audit">Medya &amp; Kullanıcı</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-4">
          <DetailedRecentActivity activities={activities} />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
