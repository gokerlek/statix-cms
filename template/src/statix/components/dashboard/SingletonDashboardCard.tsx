"use client";

import Link from "next/link";

import { resolveStatus } from "@/statix/lib/content-status";
import { Button } from "@/statix/components/ui/button";
import ui from "@/statix/content/ui.json";
import { ROUTES } from "@/statix/lib/constants";

import { CollectionIcon } from "@/statix/components/collections/CollectionIcon";
import { LastUpdated } from "@/statix/components/editor/LastUpdated";
import { CMSCard } from "@/statix/components/shared/CMSCard";
import { StatusBadge } from "@/statix/components/collections/StatusBadge";

interface Stat {
  count: number;
  label: string;
  icon?: string;
  lastUpdated?: string | null;
  slug: string;
  content?: Record<string, unknown> | null;
}

interface SingletonDashboardCardProps {
  stat: Stat;
}

export function SingletonDashboardCard({ stat }: SingletonDashboardCardProps) {
  const editLink = ROUTES.ADMIN.SINGLETON(stat.slug);
  const content = stat.content || {};
  const status = (content.status as string) || null;

  return (
    <CMSCard
      title={stat.label}
      action={
        <CollectionIcon
          icon={stat.icon}
          className="h-5 w-5 text-muted-foreground"
        />
      }
      className="group overflow-hidden relative"
      contentClassName="flex-1 flex flex-col justify-end gap-4 relative z-10"
      footerClassName="relative z-10 pt-0"
      footer={
        <Button className="w-full group/btn" variant="outline" asChild>
          <Link href={editLink}>{ui.common.edit}</Link>
        </Button>
      }
    >
      <div className="flex items-center justify-between text-sm">
        <LastUpdated dateString={stat?.lastUpdated} />
        <StatusBadge status={resolveStatus(status)} />
      </div>
    </CMSCard>
  );
}
