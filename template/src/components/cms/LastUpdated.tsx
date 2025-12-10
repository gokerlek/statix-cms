"use client";

import { formatDistanceToNow } from "date-fns";

interface LastUpdatedProps {
  dateString?: string | null;
  className?: string;
}

export function LastUpdated({ dateString, className }: LastUpdatedProps) {
  if (!dateString) return null;

  return (
    <p
      className={`text-xs text-center text-muted-foreground ${className || ""}`}
    >
      Updated {formatDistanceToNow(new Date(dateString), { addSuffix: true })}
    </p>
  );
}
