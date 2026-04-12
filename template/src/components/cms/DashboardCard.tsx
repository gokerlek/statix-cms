"use client";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import { IconPlus } from "@tabler/icons-react";

import { DonutChart } from "@/components/cms/DonutChart";
import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";

import { CollectionIcon } from "./CollectionIcon";
import { CMSCard } from "./shared/CMSCard";

interface Stat {
  count: number;
  label: string;
  icon?: string;
  lastUpdated?: string | null;
  statusBreakdown?: Record<string, number>;
  slug: string;
}

interface DashboardCardProps {
  stat: Stat;
}

const chartConfig = {
  Published: {
    label: "published",
    color: "var(--status-published)",
  },
  Draft: {
    label: "draft",
    color: "var(--status-draft)",
  },
  Archived: {
    label: "archived",
    color: "var(--status-archived)",
  },
};

export function DashboardCard({ stat }: DashboardCardProps) {
  const viewLink = ROUTES.ADMIN.COLLECTION(stat.slug);
  const addLink = ROUTES.ADMIN.COLLECTION_NEW(stat.slug);

  const chartData = Object.entries(stat.statusBreakdown || {}).map(
    ([status, count]) => ({
      status,
      count,
      fill:
        chartConfig[status as keyof typeof chartConfig]?.color ||
        "var(--status-draft)",
    }),
  );

  const total = chartData.reduce((acc, curr) => acc + curr.count, 0);

  const lastUpdatedText = stat.lastUpdated
    ? formatDistanceToNow(new Date(stat.lastUpdated), { addSuffix: true })
    : "Items";

  return (
    <CMSCard
      title={stat.label}
      action={
        <CollectionIcon
          icon={stat.icon}
          className="h-5 w-5 text-muted-foreground"
        />
      }
      className="group gap-0 row-span-2"
      contentClassName="flex-1 flex flex-col justify-between p-0"
      footer={
        stat.count === 0 ? (
          <Button className="w-full" asChild>
            <Link href={addLink}>
              <IconPlus className="mr-2 h-4 w-4" />
              {ui.collectionList.createFirstEntry}
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full">
            {addLink && (
              <Button variant="outline" size="icon" asChild>
                <Link href={addLink} title={ui.common.createNew}>
                  <IconPlus className="size-7" />
                </Link>
              </Button>
            )}
            <Button className="flex-1" variant="outline" asChild>
              <Link href={viewLink}>{ui.common.viewAll}</Link>
            </Button>
          </div>
        )
      }
    >
      {stat.count === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground space-y-2">
          <p className="text-sm">
            {ui.collectionList.noEntriesDescription.replace(
              "{label}",
              stat.label,
            )}
          </p>
        </div>
      ) : (
        <DonutChart
          data={chartData}
          dataKey="count"
          nameKey="status"
          total={total}
          totalLabel={lastUpdatedText}
          config={chartConfig}
        />
      )}
    </CMSCard>
  );
}
