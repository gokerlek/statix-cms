"use client";

import Link from "next/link";

import { Clock } from "lucide-react";

import { Activity, ActivityItem } from "@/components/cms/ActivityItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4 text-muted-foreground" />

          {ui.dashboard.stats.recentActivity}
        </CardTitle>

        <Button variant="outline" size="sm" asChild>
          <Link
            href={ROUTES.ADMIN.ACTIVITY}
            className="flex items-center gap-1"
          >
            {ui.common.viewAll}
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          {activities.map((activity) => (
            <ActivityItem key={activity.sha} activity={activity} isCard />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
