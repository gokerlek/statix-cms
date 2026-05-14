"use client";

import {
  ChangeCard,
  ChangeCardFieldLine,
} from "@/statix/components/editor/diff/ChangeCard";
import ui from "@/statix/content/ui.json";
import {
  diffListItems,
  type IdentifiableItem,
} from "@/statix/lib/field-diff";

interface ListDiffViewProps {
  previous: unknown[] | undefined | null;
  current: unknown[] | undefined | null;
  /** Which key to use as the human-readable title for each item — usually
   *  the list's primary text field (e.g. `"label"`, `"title"`, `"name"`). */
  titleKey?: string;
}

function pickTitle(item: IdentifiableItem, titleKey?: string): string {
  const candidates = [titleKey, "title", "name", "label"].filter(
    Boolean,
  ) as string[];
  for (const key of candidates) {
    const v = item[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return item.id;
}

function renderValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return ui.fieldIndicator.empty;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    const s = String(value);
    return s.length > 80 ? `${s.slice(0, 80)}…` : s;
  }
  if (Array.isArray(value)) return `${value.length} items`;
  try {
    const j = JSON.stringify(value);
    return j.length > 80 ? `${j.slice(0, 80)}…` : j;
  } catch {
    return "[object]";
  }
}

/**
 * Render the `diffListItems` result as a stack of `ChangeCard`s. Pure
 * composition — every visual primitive (Card/Badge/icon) comes from the
 * shared kit.
 */
export function ListDiffView({
  previous,
  current,
  titleKey,
}: ListDiffViewProps) {
  const diff = diffListItems(previous, current);

  if (diff.unchanged) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        {ui.fieldIndicator.empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {diff.added.map(({ id, item }) => (
        <ChangeCard
          key={`added-${id}`}
          kind="added"
          title={pickTitle(item, titleKey)}
        />
      ))}

      {diff.removed.map(({ id, item }) => (
        <ChangeCard
          key={`removed-${id}`}
          kind="removed"
          title={pickTitle(item, titleKey)}
        />
      ))}

      {diff.modified.map(({ id, oldItem, newItem, changedKeys }) => (
        <ChangeCard
          key={`modified-${id}`}
          kind="modified"
          title={pickTitle(newItem, titleKey)}
        >
          <div className="mt-1 space-y-0.5">
            {changedKeys.map((key) => (
              <ChangeCardFieldLine
                key={key}
                label={key}
                from={renderValue(oldItem[key])}
                to={renderValue(newItem[key])}
              />
            ))}
          </div>
        </ChangeCard>
      ))}

      {diff.moved.map(({ id, item, from, to }) => (
        <ChangeCard
          key={`moved-${id}`}
          kind="moved"
          title={pickTitle(item, titleKey)}
          subtitle={`${ui.fieldIndicator.fromPosition
            .replace("{from}", String(from + 1))} → ${ui.fieldIndicator.toPosition
            .replace("{to}", String(to + 1))}`}
        />
      ))}
    </div>
  );
}
