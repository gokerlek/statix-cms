"use client";

import { ReactNode, useMemo, useState } from "react";
import { Control, useWatch } from "react-hook-form";

import { FieldChangeModal } from "@/statix/components/editor/FieldChangeModal";
import { Badge } from "@/statix/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/statix/components/ui/tooltip";
import ui from "@/statix/content/ui.json";
import { deepEqual, getByPath } from "@/statix/lib/field-diff";
import { cn, resolveImageUrl } from "@/statix/lib/utils";
import { ContentFormValues } from "@/statix/types/content";

/** Which field types open a dedicated side-by-side drawer instead of
 *  displaying everything in the tooltip. */
const COMPLEX_FIELD_TYPES = new Set(["richtext", "list", "blocks"]);

interface DirtyFieldIndicatorProps {
  /** Form path. Supports dotted paths like `translations.en.title`. */
  name: string;
  control: Control<ContentFormValues>;
  /**
   * The last-known server state for the whole form. Null means "snapshot
   * not ready yet" — we render children untouched in that case.
   */
  snapshot: ContentFormValues | null;
  /**
   * Field type from `statixConfig` — drives the preview shape:
   *  - `"image"` / `"file"` → thumbnail diff in tooltip
   *  - `"richtext"` / `"list"` / `"blocks"` → tooltip summary + a
   *    "View changes" button that opens `FieldChangeDrawer`
   *  - everything else → text preview in tooltip
   */
  fieldType?: string;
  /** Human-readable label for the drawer header (e.g. "Related Posts"). */
  fieldLabel?: string;
  /**
   * Revert this single field back to its snapshot value. Wired up by the
   * editor page via `useEditorForm().revertField`. Optional so legacy usages
   * without the prop still render the indicator without a revert button.
   */
  onRevert?: (name: string) => void;
  children: ReactNode;
}

/** Heuristic — does this string look like rich-text HTML (ProseKit output)? */
function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(s);
}

/**
 * Strip HTML tags + decode entities so the tooltip shows the user's actual
 * text instead of `<p>Hello</p>`. On the client we use DOMParser (handles
 * `&amp;`, `&nbsp;`, nested inline tags, etc). On the server we fall back to
 * a regex — good enough for the subset of markup ProseKit emits.
 */
function stripHtml(html: string): string {
  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(s: string, max = 140): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** Render a value in a way that is helpful inside the tooltip preview. */
function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return ui.fieldIndicator.empty;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    let str = String(value);
    // RichText fields store ProseKit HTML — pull the plain text out so the
    // tooltip reads naturally instead of showing raw markup.
    if (typeof value === "string" && looksLikeHtml(str)) {
      str = stripHtml(str);
      if (str.length === 0) return ui.fieldIndicator.empty;
    }
    return truncate(str);
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  try {
    return truncate(JSON.stringify(value));
  } catch {
    return "[unserializable]";
  }
}

/** Render one side ("was"/"now") as a small image thumbnail. Falls through
 *  to text when the value is empty or not a string. */
function ImagePreview({ value }: { value: unknown }) {
  if (typeof value !== "string" || value.trim() === "") {
    return (
      <span className="text-muted-foreground italic">
        {ui.fieldIndicator.empty}
      </span>
    );
  }

  const url = resolveImageUrl(value);

  return (
    <div className="flex flex-col gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-20 w-20 object-cover rounded border border-border bg-muted"
        loading="lazy"
      />
      <span
        className="text-[10px] text-muted-foreground break-all max-w-[5rem]"
        title={value}
      >
        {value.split("/").pop()}
      </span>
    </div>
  );
}

/** Two thumbnails side-by-side with a subtle divider — used for image/file
 *  fields so the user can visually diff the old and new attachment. */
function ImageDiff({ previous, current }: { previous: unknown; current: unknown }) {
  return (
    <div className="flex items-start gap-3">
      <div>
        <div className="text-[10px] font-semibold mb-1">
          {ui.fieldIndicator.was}
        </div>
        <ImagePreview value={previous} />
      </div>
      <div className="w-px self-stretch bg-border" />
      <div>
        <div className="text-[10px] font-semibold mb-1">
          {ui.fieldIndicator.now}
        </div>
        <ImagePreview value={current} />
      </div>
    </div>
  );
}

/**
 * Wraps a single editor field and renders an amber "modified" affordance when
 * the current form value differs from the snapshot. The indicator consists of:
 *  - a 3px amber left rail on the container, so a glance down the form shows
 *    which sections are pending
 *  - a small "Modified" badge top-right with a hover tooltip that reveals the
 *    previous value (Was …) and the current value (Now …).
 */
export function DirtyFieldIndicator({
  name,
  control,
  snapshot,
  fieldType,
  fieldLabel,
  onRevert,
  children,
}: DirtyFieldIndicatorProps) {
  const current = useWatch({ control, name });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { isDirty, previous } = useMemo(() => {
    if (!snapshot) return { isDirty: false, previous: undefined };
    const old = getByPath(snapshot, name);
    return { isDirty: !deepEqual(current, old), previous: old };
  }, [current, snapshot, name]);

  const isVisualField = fieldType === "image" || fieldType === "file";
  const isComplexField =
    fieldType !== undefined && COMPLEX_FIELD_TYPES.has(fieldType);

  // CRITICAL: the wrapper element must stay structurally identical whether
  // `isDirty` is true or false. Toggling between `<>{children}</>` and
  // `<div>...{children}</div>` re-parents the child subtree, which
  // unmounts-and-remounts the ProseKit editor and kills the input focus
  // the user is actively typing into. Keep one <div>, hide the indicator
  // chrome conditionally.
  return (
    <div
      data-field-dirty={isDirty || undefined}
      className={cn("relative")}
    >
      {isDirty && (
        <Tooltip>
          <TooltipTrigger
            className={cn("absolute -top-2 right-0 z-10")}
            aria-label={ui.fieldIndicator.modified}
          >
            <Badge variant="warning">{ui.fieldIndicator.modified}</Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-sm">
            <div className="space-y-2">
              {isVisualField ? (
                <ImageDiff previous={previous} current={current} />
              ) : (
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="font-semibold">
                      {ui.fieldIndicator.was}:
                    </span>{" "}
                    <span className="wrap-break-word">
                      {formatValue(previous)}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold">
                      {ui.fieldIndicator.now}:
                    </span>{" "}
                    <span className="wrap-break-word">
                      {formatValue(current)}
                    </span>
                  </p>
                </div>
              )}
            <div className="flex items-center gap-3 pt-1 border-t border-border/60">
              {isComplexField && (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    "text-foreground hover:underline",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm",
                  )}
                >
                  {ui.fieldIndicator.viewChanges}
                </button>
              )}
              {onRevert && (
                <button
                  type="button"
                  onClick={() => onRevert(name)}
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium ml-auto",
                    "text-amber-700 dark:text-amber-300 hover:underline",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm",
                  )}
                  aria-label={ui.fieldIndicator.revertField}
                >
                  <span aria-hidden>↶</span> {ui.fieldIndicator.undo}
                </button>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
      )}

      {children}

      {isComplexField && (
        <FieldChangeModal
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          fieldLabel={fieldLabel ?? name}
          fieldType={fieldType as "richtext" | "list" | "blocks"}
          previous={previous}
          current={current}
          onRevert={onRevert ? () => onRevert(name) : undefined}
        />
      )}
    </div>
  );
}
