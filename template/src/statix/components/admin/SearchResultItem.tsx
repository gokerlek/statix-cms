"use client";

import Link from "next/link";

import { StatusBadge } from "@/statix/components/collections/StatusBadge";
import { Card, CardContent } from "@/statix/components/ui/card";
import { cn } from "@/statix/lib/utils";

export interface SearchHit {
  collection: string;
  collectionLabel: string;
  id: string;
  title: string;
  slug?: string;
  status?: string;
  score: number;
}

interface SearchResultItemProps {
  hit: SearchHit;
  href: string;
  onSelect?: () => void;
  className?: string;
}

/**
 * One row of the CommandPalette result list. Uses the same Card/Badge
 * primitives as `UserListItem` and the dashboard cards so the palette visually
 * matches the rest of the admin.
 */
export function SearchResultItem({
  hit,
  href,
  onSelect,
  className,
}: SearchResultItemProps) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={cn(
        "block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Card className="gap-0 py-0 rounded-lg  shadow-none hover:bg-secondary transition-colors">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{hit.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {hit.collectionLabel}
              {hit.slug ? ` · ${hit.slug}` : ""}
            </p>
          </div>
          {hit.status && (
            <StatusBadge status={hit.status} className="shrink-0" />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
