"use client";

import { ReactNode } from "react";

import {
  IconArrowsUpDown,
  IconCirclePlus,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";

import { Badge } from "@/statix/components/ui/badge";
import { Card, CardContent } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";
import { cn } from "@/statix/lib/utils";

export type ChangeKind = "added" | "removed" | "modified" | "moved";

interface ChangeCardProps {
  kind: ChangeKind;
  title: string;
  /**
   * Optional secondary line (e.g. "3. sıradaydı → 1. sırada"). Rendered
   * under the title in muted type.
   */
  subtitle?: string;
  /** Optional body slot — used by `modified` to list per-field deltas. */
  children?: ReactNode;
}

const KIND_META: Record<
  ChangeKind,
  {
    rail: string;
    icon: typeof IconCirclePlus;
    badgeVariant: "added" | "removed" | "modified" | "moved";
    label: () => string;
  }
> = {
  added: {
    rail: "border-l-emerald-400",
    icon: IconCirclePlus,
    badgeVariant: "added",
    label: () => ui.fieldIndicator.itemAdded,
  },
  removed: {
    rail: "border-l-red-400 bg-muted/30",
    icon: IconTrash,
    badgeVariant: "removed",
    label: () => ui.fieldIndicator.itemRemoved,
  },
  modified: {
    rail: "border-l-amber-400",
    icon: IconPencil,
    badgeVariant: "modified",
    label: () => ui.fieldIndicator.itemModified,
  },
  moved: {
    rail: "border-l-blue-400",
    icon: IconArrowsUpDown,
    badgeVariant: "moved",
    label: () => ui.fieldIndicator.itemMoved,
  },
};

/**
 * One row in a field-change list. Pure composition — reuses `Card`,
 * `CardContent`, `Badge`, and tabler icons. The color-coded left rail
 * mirrors the dirty-field rail in the editor so the two views read as
 * one visual language.
 */
export function ChangeCard({ kind, title, subtitle, children }: ChangeCardProps) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  return (
    <Card
      data-change-kind={kind}
      className={cn(
        "gap-0 py-0 rounded-md shadow-none border-l-4",
        meta.rail,
      )}
    >
      <CardContent className="flex items-start gap-3 p-3">
        <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={meta.badgeVariant} className="text-[10px]">
              {meta.label()}
            </Badge>
            <span className="font-medium text-sm truncate">{title}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Small helper for the `modified` variant body — renders a single
 * "key: old → new" line. Used inside `ChangeCard` children when a
 * modified item has per-field deltas we want to show.
 */
export function ChangeCardFieldLine({
  label,
  from,
  to,
}: {
  label: string;
  from: ReactNode;
  to: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
      <span className="text-muted-foreground">{label}:</span>
      <span className="flex items-center gap-1.5 flex-wrap break-all">
        <span className="line-through text-muted-foreground">{from}</span>
        <span aria-hidden className="text-muted-foreground">→</span>
        <span>{to}</span>
      </span>
    </div>
  );
}
