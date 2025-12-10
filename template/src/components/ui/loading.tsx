"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Full page loading state with centered spinner and optional message.
 * Use for page-level content fetching or initial page loads.
 */
interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message, className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[50vh] gap-3",
        className,
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

/**
 * Inline button loading spinner.
 * Use inside buttons during form submissions or async actions.
 */
interface ButtonLoadingProps {
  className?: string;
}

export function ButtonLoading({ className }: ButtonLoadingProps) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

/**
 * Section/content area loading state with spinner and optional message.
 * Use for card contents, media grids, or partial content loading.
 */
interface SectionLoadingProps {
  message?: string;
  className?: string;
}

export function SectionLoading({ message, className }: SectionLoadingProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />

      {message && <span className="ml-2 text-muted-foreground">{message}</span>}
    </div>
  );
}
