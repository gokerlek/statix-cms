"use client";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import { IconArrowRight } from "@tabler/icons-react";

import { Badge } from "@/statix/components/ui/badge";
import { Button } from "@/statix/components/ui/button";
import { EmptyState } from "@/statix/components/shared/EmptyState";
import ui from "@/statix/content/ui.json";
import { AuditFeedItem } from "@/statix/lib/monitor-data";

interface RecentAuditFeedProps {
  items: AuditFeedItem[];
}

type ActionLabel = keyof typeof ui.monitor.actionLabels;

function formatAction(action: string): string {
  return ui.monitor.actionLabels[action as ActionLabel] ?? action;
}

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("delete") || action.includes("ban")) return "destructive";
  if (action.includes("create") || action.includes("invite") || action.includes("restore")) return "default";
  if (action.includes("login") || action.includes("logout")) return "secondary";

  return "outline";
}

export function RecentAuditFeed({ items }: RecentAuditFeedProps) {
  if (items.length === 0) {
    return <EmptyState message={ui.monitor.empty} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant={actionVariant(item.action)} className="text-xs shrink-0">
              {formatAction(item.action)}
            </Badge>
            {item.userName && (
              <span className="text-xs text-muted-foreground truncate">
                {item.userName}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      ))}

      <div className="pt-2 border-t">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/admin/monitor">
            {ui.monitor.auditFeed.viewAll}
            <IconArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
