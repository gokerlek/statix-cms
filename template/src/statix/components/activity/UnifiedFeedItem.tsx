"use client";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";

import { UserAvatar } from "@/statix/components/shared/UserAvatar";
import { Badge } from "@/statix/components/ui/badge";
import { Button } from "@/statix/components/ui/button";
import { Card, CardContent } from "@/statix/components/ui/card";
import type { UnifiedActivityItem } from "@/statix/lib/activity-feed";

interface UnifiedFeedItemProps {
  item: UnifiedActivityItem;
}

function actionVariant(
  actionKey: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (
    actionKey.includes("delete") ||
    actionKey.includes("ban") ||
    actionKey.includes("permanent")
  )
    return "destructive";
  if (
    actionKey.includes("create") ||
    actionKey.includes("upload") ||
    actionKey.includes("invite") ||
    actionKey.includes("restore")
  )
    return "default";
  if (actionKey.includes("login") || actionKey.includes("logout"))
    return "secondary";
  return "outline";
}


export function UnifiedFeedItem({ item }: UnifiedFeedItemProps) {
  return (
    <Card className="gap-0 py-0 rounded-lg relative" >
      <CardContent className="flex items-start justify-between gap-4 p-4">
        {/* Avatar */}
        <UserAvatar
          src={item.actorAvatar}
          name={item.actorName}
          email={item.actorEmail}
          className="size-14 border-2 border-background shadow-sm shrink-0"
        />

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold whitespace-nowrap">
              {item.actorName ?? item.actorEmail ?? "System"}
            </span>

            <div className='flex items-center gap-2'>
            <Badge variant={actionVariant(item.actionKey)} className="text-xs">
              {item.actionLabel}
              {/* GitHub link */}
            </Badge>
            {item.externalUrl && (
                <Button variant="ghost" size="icon" className="shrink-0  p-1 size-fit" asChild>
                  <Link
                      href={item.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View on GitHub"
                  >
                    <IconExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
            )}
            </div>
          </div>

            {item.collectionLabel && (
              <div className='flex items-center gap-1'>
                <span className="text-xs text-muted-foreground">in</span>
                {item.editUrl ? (
                  <Link
                    href={item.editUrl}
                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                  >
                    {item.collectionLabel}
                    <IconArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {item.collectionLabel}
                  </span>
                )}
              </div>
            )}

          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            {item.detail && (
              <>
                <span className="truncate max-w-[240px]">{item.detail}</span>
                <span>•</span>
              </>
            )}
            <span className="whitespace-nowrap" suppressHydrationWarning>
              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
            </span>
            {item.source === "github" && (
              <>
                <span>•</span>
                <span className="text-muted-foreground/50">via GitHub</span>
              </>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
