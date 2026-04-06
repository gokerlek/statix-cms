import { redirect } from "next/navigation";

import { DashboardCard } from "@/components/cms/DashboardCard";
import { DashboardUnsavedAlert } from "@/components/cms/DashboardUnsavedAlert";
import { LocalizationStats } from "@/components/cms/LocalizationStats";
import { MediaOverview } from "@/components/cms/MediaOverview";
import { RecentActivity } from "@/components/cms/RecentActivity";
import { SingletonDashboardCard } from "@/components/cms/SingletonDashboardCard";
import { SystemHealth } from "@/components/cms/SystemHealth";
import { TrashCard } from "@/components/cms/TrashCard";
import { UserCard } from "@/components/cms/UserCard";
import {
  getCollectionStats,
  getLocalizationStats,
  getRecentActivity,
  getSystemStats,
} from "@/lib/dashboard-data";
import { getSession } from "@/lib/session";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user;


  const [collectionStats, recentCommits, localizationStats, systemStats] =
    await Promise.all([
      getCollectionStats(),
      getRecentActivity(5),
      getLocalizationStats(),
      getSystemStats(),
    ]);

  const regularCollections = collectionStats.filter(
    (c) => c.type !== "singleton",
  );

  const singletonCollections = collectionStats.filter(
    (c) => c.type === "singleton",
  );

  return (
    <div className="space-y-8">
      <DashboardUnsavedAlert />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="flex flex-col gap-4">
          <UserCard user={user} />

          <TrashCard />
        </div>

        <SystemHealth stats={systemStats} />

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

      <RecentActivity activities={recentCommits} />
    </div>
  );
}
