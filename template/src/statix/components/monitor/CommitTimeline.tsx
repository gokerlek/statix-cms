"use client";

import Image from "next/image";

import { formatDistanceToNow } from "date-fns";
import { IconGitCommit, IconUser } from "@tabler/icons-react";

import { EmptyState } from "@/statix/components/shared/EmptyState";
import ui from "@/statix/content/ui.json";
import { ParsedCommit } from "@/statix/lib/monitor-data";

interface CommitTimelineProps {
  commits: ParsedCommit[];
}

export function CommitTimeline({ commits }: CommitTimelineProps) {
  if (commits.length === 0) {
    return <EmptyState message={ui.monitor.noCommits} />;
  }

  return (
    <div className="space-y-3">
      {commits.map((commit) => (
        <div key={commit.sha} className="flex items-start gap-3 text-sm">
          {commit.isStatix ? (
            commit.avatar_url ? (
              <Image
                src={commit.avatar_url}
                alt={commit.name ?? commit.user ?? "user"}
                width={28}
                height={28}
                className="rounded-full mt-0.5 shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <IconUser className="h-4 w-4 text-primary" />
              </div>
            )
          ) : (
            commit.avatar_url ? (
              <Image
                src={commit.avatar_url}
                alt={commit.authorName}
                width={28}
                height={28}
                className="rounded-full mt-0.5 shrink-0 opacity-60"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <IconGitCommit className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium truncate">
                {commit.isStatix ? (commit.name ?? commit.user) : commit.authorName}
              </span>
              {commit.isStatix && (
                <span className="text-xs text-primary shrink-0">·</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{commit.title}</p>
            <span className="text-xs text-muted-foreground/60">
              {formatDistanceToNow(new Date(commit.time ?? commit.date), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
