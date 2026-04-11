import { redirect } from "next/navigation";

import ui from "@/content/ui.json";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardCard } from "@/components/cms/DashboardCard";
import { DashboardUnsavedAlert } from "@/components/cms/DashboardUnsavedAlert";
import { LocalizationStats } from "@/components/cms/LocalizationStats";
import { MediaOverview } from "@/components/cms/MediaOverview";
import { MonitorSummaryCard } from "@/components/cms/MonitorSummaryCard";
import { SingletonDashboardCard } from "@/components/cms/SingletonDashboardCard";
import { TrashCard } from "@/components/cms/TrashCard";
import { UsersCard } from "@/components/cms/UsersCard";
import { UserProfileCard } from "@/components/cms/UserProfileCard";
import type { CMSUser } from "@/app/admin/users/page";
import {
  getCollectionStats,
  getLocalizationStats,
  getSystemStats,
} from "@/lib/dashboard-data";
import { getMonitorSummary } from "@/lib/monitor-data";
import { getSession } from "@/lib/session";

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


  const isAdmin = user.role === "admin";

  const [collectionStats, localizationStats, monitorSummary] =
    await Promise.all([
      getCollectionStats(),
      getLocalizationStats(),
      getSystemStats(),
      isAdmin ? getMonitorSummary() : Promise.resolve(null),
    ]);

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
          <UserProfileCard user={user as CMSUser} />

          <div className="flex gap-4  h-full">
            <TrashCard />
            {isAdmin && <UsersCard />}
          </div>
        </div>

        {isAdmin && monitorSummary && (
          <MonitorSummaryCard summary={monitorSummary} />
        )}

        {regularCollections.length > 0 &&
          regularCollections.map((collection) => (
            <DashboardCard stat={collection} key={collection.slug} />
          ))}

        {/* Singleton Cards */}
        {singletonCollections.length > 0 &&
          singletonCollections.map((collection) => (
            <SingletonDashboardCard stat={collection} key={collection.slug} />
          ))}
      </div>

      <MediaOverview />

      <LocalizationStats stats={localizationStats} />
    </div>
  );
}
