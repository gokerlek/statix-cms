import { redirect } from "next/navigation";

import ui from "@/statix/content/ui.json";
import { Alert, AlertDescription } from "@/statix/components/ui/alert";
import { DashboardCard } from "@/statix/components/dashboard/DashboardCard";
import { DashboardUnsavedAlert } from "@/statix/components/dashboard/DashboardUnsavedAlert";
import { LocalizationStats } from "@/statix/components/dashboard/LocalizationStats";
import { MediaOverview } from "@/statix/components/media/MediaOverview";
import { MonitorSummaryCard } from "@/statix/components/monitor/MonitorSummaryCard";
import { SingletonDashboardCard } from "@/statix/components/dashboard/SingletonDashboardCard";
import { TrashCard } from "@/statix/components/trash/TrashCard";
import { UsersCard } from "@/statix/components/users/UsersCard";
import { UserProfileCard } from "@/statix/components/users/UserProfileCard";
import type { CMSUser } from "@/app/(statix)/admin/users/page";
import { cleanupOldAuditLogs } from "@/statix/lib/audit";
import {
  getCollectionStats,
  getLocalizationStats,
  getSystemStats,
} from "@/statix/lib/dashboard-data";
import { getMonitorSummary } from "@/statix/lib/monitor-data";
import { getSession, getUserPermissions } from "@/statix/lib/session";
import { hasGlobalPermission, hasCollectionPermission, P, CP } from "@/statix/types/permissions";

interface AdminDashboardProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const { error } = await searchParams;
  const user = session.user;

  const permissions = await getUserPermissions(user.id);

  const [collectionStats, localizationStats, , monitorSummary] =
    await Promise.all([
      getCollectionStats(),
      getLocalizationStats(),
      getSystemStats(),
      hasGlobalPermission(permissions, P.VIEW_MONITOR) ? getMonitorSummary() : Promise.resolve(null),
    ]);

  // Opportunistic cleanup — runs on every dashboard load, fire-and-forget
  cleanupOldAuditLogs().catch(() => {});

  const regularCollections = collectionStats.filter(
    (c) => c.type !== "singleton",
  );

  const singletonCollections = collectionStats.filter(
    (c) => c.type === "singleton",
  );

  return (
    <div className="space-y-8">
      {error === "forbidden" && (
        <Alert variant="destructive">
          <AlertDescription>{ui.dashboard.errors.forbidden}</AlertDescription>
        </Alert>
      )}

      <DashboardUnsavedAlert />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="flex flex-col gap-4">
          <UserProfileCard user={user as unknown as CMSUser} />

          <div className="flex gap-4  h-full">
            {hasGlobalPermission(permissions, P.MANAGE_TRASH) && <TrashCard />}
            {hasGlobalPermission(permissions, P.MANAGE_USERS) && <UsersCard />}
          </div>
        </div>

        {hasGlobalPermission(permissions, P.VIEW_MONITOR) && monitorSummary && (
          <MonitorSummaryCard summary={monitorSummary} />
        )}

        {regularCollections
          .filter((c) => hasCollectionPermission(permissions, c.slug, CP.VIEW))
          .map((collection) => (
            <DashboardCard stat={collection} key={collection.slug} />
          ))}

        {/* Singleton Cards */}
        {singletonCollections
          .filter((c) => hasCollectionPermission(permissions, c.slug, CP.VIEW))
          .map((collection) => (
            <SingletonDashboardCard stat={collection} key={collection.slug} />
          ))}
      </div>

      {hasGlobalPermission(permissions, P.MANAGE_MEDIA) && <MediaOverview />}

      {collectionStats.some((c) => hasCollectionPermission(permissions, c.slug, CP.VIEW)) && (
        <LocalizationStats stats={localizationStats} />
      )}
    </div>
  );
}
