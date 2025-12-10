"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";

import { CollectionIcon } from "./CollectionIcon";
import { LastUpdated } from "./LastUpdated";
import { StatusBadge } from "./StatusBadge";

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
    <Card className="group hover:border-primary transition-colors ease-in-out duration-300 flex flex-col h-full relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {stat.label}
        </CardTitle>

        <CollectionIcon
          icon={stat.icon}
          className="h-5 w-5 text-muted-foreground"
        />
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-end gap-4 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <LastUpdated dateString={stat?.lastUpdated} />

          <StatusBadge status={status || "draft"} />
        </div>
      </CardContent>

      <CardFooter className="relative z-10 pt-0">
        <Button className="w-full group/btn" variant="outline" asChild>
          <Link href={editLink}>{ui.common.edit}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
