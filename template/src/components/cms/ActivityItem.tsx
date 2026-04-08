"use client";

import Link from "next/link";

import { formatDistanceToNow } from "date-fns";
import {
  ExternalLink,
  FilePenLine,
  GitCommit,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ui from "@/content/ui.json";

export interface Activity {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatar_url: string;
  };
  html_url?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  create: PlusCircle,
  update: FilePenLine,
  delete: Trash2,
  default: GitCommit,
};

export function getActivityType(message: string): string {
  const lowerMsg = message.toLowerCase();

  if (
    lowerMsg.includes("create") ||
    lowerMsg.includes("add") ||
    lowerMsg.includes("new")
  ) {
    return "create";
  }

  if (
    lowerMsg.includes("update") ||
    lowerMsg.includes("edit") ||
    lowerMsg.includes("change") ||
    lowerMsg.includes("modify")
  ) {
    return "update";
  }

  if (lowerMsg.includes("delete") || lowerMsg.includes("remove")) {
    return "delete";
  }

  return "default";
}

function getActionColor(type: string): string {
  switch (type) {
    case "create":
      return "text-emerald-500";
    case "update":
      return "text-blue-500";
    case "delete":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

function isTechnicalEmail(email: string): boolean {
  return email.includes("noreply") || email.includes("backup");
}

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const type = getActivityType(activity.message);
  const ActionIcon = ICON_MAP[type] || ICON_MAP.default;
  const actionColor = getActionColor(type);
  const showEmail = !isTechnicalEmail(activity.author.email);

  return (
    <Card className="gap-0 py-0 rounded-lg">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between p-4">
        <div className="flex items-start sm:items-center gap-4 mb-3 sm:mb-0 min-w-0 flex-1">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm shrink-0">
            <AvatarImage
              src={activity.author.avatar_url}
              alt={activity.author.name}
            />
            <AvatarFallback>
              {activity.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
              <span className="text-sm font-semibold whitespace-nowrap">
                {activity.author.name}
              </span>

              <span className="hidden sm:inline text-gray-300 shrink-0">|</span>

              <div className="flex items-center gap-1.5 text-sm min-w-0">
                <ActionIcon className={`w-4 h-4 shrink-0 ${actionColor}`} />

                <span className="font-medium text-foreground/80 truncate block w-full">
                  {activity.message}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {showEmail && (
                <>
                  <span className="truncate max-w-[150px]">
                    {activity.author.email}
                  </span>

                  <span>•</span>
                </>
              )}

              <span className="whitespace-nowrap" suppressHydrationWarning>
                {formatDistanceToNow(new Date(activity.author.date), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>

        {activity.html_url && (
          <div className="flex sm:ml-4 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="w-full sm:w-auto ml-auto"
              asChild
            >
              <Link
                href={activity.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
                title={ui.common.viewOnGithub}
              >
                <span className="sm:hidden">{ui.dashboard.activity.link}</span>

                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
