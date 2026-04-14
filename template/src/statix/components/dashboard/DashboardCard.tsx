"use client";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import { IconPlus } from "@tabler/icons-react";

import { DonutChart } from "@/statix/components/dashboard/DonutChart";
import { buttonVariants } from "@/statix/components/ui/button";
import ui from "@/statix/content/ui.json";
import { STATUS_CHART_CONFIG } from "@/statix/lib/content-status";
import { ROUTES } from "@/statix/lib/constants";

import { CollectionIcon } from "@/statix/components/collections/CollectionIcon";
import { CMSCard } from "@/statix/components/shared/CMSCard";
import { cn } from "@/statix/lib/utils";

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

const chartConfig = STATUS_CHART_CONFIG;

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
            <Link href={addLink} className={cn(buttonVariants({ variant: "default" }), "w-full")}>
              <IconPlus className="mr-2 h-4 w-4" />
              {ui.collectionList.createFirstEntry}
            </Link>
        ) : (
          <div className="flex items-center gap-2 w-full">
            {addLink && (
                <Link href={addLink} title={ui.common.createNew} className={cn(buttonVariants({ variant: "outline", size:"icon" }))}>
                  <IconPlus className="size-7" />
                </Link>
            )}
              <Link href={viewLink} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>{ui.common.viewAll}</Link>
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
