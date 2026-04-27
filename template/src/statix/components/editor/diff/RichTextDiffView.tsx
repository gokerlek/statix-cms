"use client";

import { useEffect, useMemo, useState } from "react";

import { HtmlContent } from "@/statix/components/editor/diff/HtmlContent";
import { Badge } from "@/statix/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/statix/components/ui/table";
import ui from "@/statix/content/ui.json";
import { cn } from "@/statix/lib/utils";
import {
  DiffSegment,
  diffLines,
  type LineDiffRow,
} from "@/statix/lib/text-diff";

interface RichTextDiffViewProps {
  previousHtml: string;
  currentHtml: string;
}

/** One block-level element captured with both plain text (for diffing)
 *  and outerHTML (so we can render the formatted version back verbatim). */
interface HtmlBlock {
  text: string;
  outerHtml: string;
}

const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre";

function htmlToBlocks(html: string): HtmlBlock[] {
  if (!html || html.trim() === "") return [];

  if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const nodes = doc.body.querySelectorAll(BLOCK_SELECTOR);
    const blocks: HtmlBlock[] = [];
    nodes.forEach((node) => {
      const text = (node.textContent ?? "").replace(/\s+/g, " ").trim();
      if (text.length > 0) {
        blocks.push({ text, outerHtml: (node as HTMLElement).outerHTML });
      }
    });
    if (blocks.length === 0) {
      const fallback = (doc.body.textContent ?? "").trim();
      if (fallback.length > 0) {
        return [{ text: fallback, outerHtml: `<p>${fallback}</p>` }];
      }
    }
    return blocks;
  }

  const regex = /<(p|h[1-6]|li|blockquote|pre)[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocks: HtmlBlock[] = [];
  for (const match of html.matchAll(regex)) {
    const outer = match[0] ?? "";
    const inner = (match[2] ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
    if (inner.length > 0) blocks.push({ text: inner, outerHtml: outer });
  }
  return blocks;
}

function summarize(rows: LineDiffRow[]) {
  let added = 0;
  let removed = 0;
  let modified = 0;
  for (const r of rows) {
    if (r.kind === "added") added += 1;
    else if (r.kind === "removed") removed += 1;
    else if (r.kind === "modified") modified += 1;
  }
  return { added, removed, modified };
}

/**
 * GitHub / IDE-style side-by-side line diff for RichText.
 *
 * This view is **read-only**. Row-level revert was removed because text
 * diff algorithms (Myers / DMP / jsdiff) have no concept of "reorder" — a
 * paragraph swap gets encoded as two near-duplicate delete+insert pairs,
 * and surgically re-splicing them back into the target HTML leaks changes
 * into neighbouring rows. Full-field revert ("Bu alanı eski haline
 * döndür") in the modal footer stays as the only reliable rollback.
 *
 * See the plan's Faz 7 V2 roadmap for the node-aware semantic diff that
 * would let us bring back row-level revert correctly.
 */
export function RichTextDiffView({
  previousHtml,
  currentHtml,
}: RichTextDiffViewProps) {
  const leftBlocks = useMemo(() => htmlToBlocks(previousHtml), [previousHtml]);
  const rightBlocks = useMemo(() => htmlToBlocks(currentHtml), [currentHtml]);

  const [rows, setRows] = useState<LineDiffRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const leftLines = leftBlocks.map((b) => b.text);
    const rightLines = rightBlocks.map((b) => b.text);
    diffLines(leftLines, rightLines)
      .then((result) => {
        // Plain-text `diffLines` misses format-only edits ("<h2>X</h2>" →
        // "<h3>X</h3>" reads as equal). Promote those to `modified` so the
        // user still sees the change — segments stay as a single `eq` span
        // and the row renders via `HtmlContent` so the format difference is
        // visible.
        const elevated = result.map((row) => {
          if (row.kind !== "equal") return row;
          const l = leftBlocks[row.lineLeft - 1];
          const r = rightBlocks[row.lineRight - 1];
          if (l && r && l.outerHtml !== r.outerHtml) {
            return {
              kind: "modified" as const,
              left: row.left,
              right: row.right,
              leftSegments: [{ op: "eq" as const, text: row.left }],
              rightSegments: [{ op: "eq" as const, text: row.right }],
              lineLeft: row.lineLeft,
              lineRight: row.lineRight,
            };
          }
          return row;
        });
        if (!cancelled) setRows(elevated);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [leftBlocks, rightBlocks]);

  if (rows === null) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        {ui.common.loading}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        {ui.fieldIndicator.empty}
      </p>
    );
  }

  const summary = summarize(rows);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {summary.added > 0 && (
          <Badge variant="added">
            {summary.added} {ui.fieldIndicator.itemAdded}
          </Badge>
        )}
        {summary.removed > 0 && (
          <Badge variant="removed">
            {summary.removed} {ui.fieldIndicator.itemRemoved}
          </Badge>
        )}
        {summary.modified > 0 && (
          <Badge variant="modified">
            {summary.modified} {ui.fieldIndicator.itemModified}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <SidePanel label={ui.fieldIndicator.was}>
          {rows.map((row, i) => {
            const leftBlock =
              row.kind !== "added" ? leftBlocks[row.lineLeft - 1] : undefined;
            return <DiffSideRow key={i} row={row} side="left" block={leftBlock} />;
          })}
        </SidePanel>

        <SidePanel label={ui.fieldIndicator.now}>
          {rows.map((row, i) => {
            const rightBlock =
              row.kind !== "removed"
                ? rightBlocks[row.lineRight - 1]
                : undefined;
            return <DiffSideRow key={i} row={row} side="right" block={rightBlock} />;
          })}
        </SidePanel>
      </div>
    </div>
  );
}

function SidePanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-12 text-right border-r text-[11px] uppercase">
              #
            </TableHead>
            <TableHead className="text-[11px] uppercase">{label}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}

/**
 * One row in either the "Was" or "Now" panel. Placeholder cells keep the
 * two tables aligned index-for-index even when a row is one-sided.
 *
 * Equal / added / removed rows render the block's original HTML so the
 * user sees real formatting (headings, bold, lists). Modified rows keep
 * word-level diff spans because formatting-aware inline diff would need a
 * DOM-level differ we don't have yet (see V2 roadmap).
 */
function DiffSideRow({
  row,
  side,
  block,
}: {
  row: LineDiffRow;
  side: "left" | "right";
  block?: HtmlBlock;
}) {
  const isPlaceholder =
    (side === "left" && row.kind === "added") ||
    (side === "right" && row.kind === "removed");

  if (isPlaceholder) {
    return (
      <TableRow className="min-h-[2.5rem]">
        <LineNumberCell n={null} muted />
        <ContentCell muted>
          <PlaceholderLine />
        </ContentCell>
      </TableRow>
    );
  }

  const kind = row.kind === "equal" ? undefined : row.kind;
  const formatOnly = row.kind === "modified" && row.left === row.right;

  let content: React.ReactNode;
  if (row.kind === "modified") {
    if (formatOnly && block) {
      content = <HtmlContent html={block.outerHtml} />;
    } else {
      const segments = side === "left" ? row.leftSegments : row.rightSegments;
      content = <SegmentSpans segments={segments} side={side} />;
    }
  } else if (block) {
    content = <HtmlContent html={block.outerHtml} />;
  } else {
    content = side === "left" ? (row as { left: string }).left : (row as { right: string }).right;
  }

  // After the placeholder check above, TS can't narrow through the runtime
  // `side` comparison — do the narrow by kind instead.
  let lineN: number;
  if (side === "left") {
    lineN =
      row.kind === "equal"
        ? row.lineLeft
        : row.kind === "removed"
          ? row.lineLeft
          : row.kind === "modified"
            ? row.lineLeft
            : 0;
  } else {
    lineN =
      row.kind === "equal"
        ? row.lineRight
        : row.kind === "added"
          ? row.lineRight
          : row.kind === "modified"
            ? row.lineRight
            : 0;
  }

  return (
    <TableRow className="min-h-[2.5rem]">
      <LineNumberCell n={lineN} kind={kind} />
      <ContentCell kind={kind}>{content}</ContentCell>
    </TableRow>
  );
}

function PlaceholderLine() {
  return (
    <span
      aria-hidden
      className="inline-block h-1 w-full max-w-[6rem] rounded bg-border/60"
    />
  );
}

function LineNumberCell({
  n,
  kind,
  muted,
}: {
  n: number | null;
  kind?: "added" | "removed" | "modified";
  muted?: boolean;
}) {
  return (
    <TableCell
      className={cn(
        "w-12 text-right border-r text-xs tabular-nums text-muted-foreground select-none align-top",
        kind === "added" && "bg-emerald-50 dark:bg-emerald-950/30",
        kind === "removed" && "bg-red-50 dark:bg-red-950/30",
        kind === "modified" && "bg-amber-50 dark:bg-amber-950/20",
        muted && "bg-muted/20",
      )}
    >
      {n ?? ""}
    </TableCell>
  );
}

function ContentCell({
  children,
  kind,
  muted,
}: {
  children?: React.ReactNode;
  kind?: "added" | "removed" | "modified";
  muted?: boolean;
}) {
  return (
    <TableCell
      className={cn(
        "whitespace-pre-wrap break-words align-top",
        kind === "added" && "bg-emerald-50 dark:bg-emerald-950/20",
        kind === "removed" && "bg-red-50 dark:bg-red-950/20",
        kind === "modified" && "bg-amber-50/60 dark:bg-amber-950/10",
        muted && "bg-muted/20",
      )}
    >
      {children}
    </TableCell>
  );
}

function SegmentSpans({
  segments,
  side,
}: {
  segments: DiffSegment[];
  side: "left" | "right";
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.op === "eq") return <span key={i}>{seg.text}</span>;
        if (side === "left" && seg.op === "del") {
          return (
            <span
              key={i}
              className="bg-red-200/70 dark:bg-red-900/40 text-red-900 dark:text-red-200 line-through rounded-sm px-0.5"
            >
              {seg.text}
            </span>
          );
        }
        if (side === "right" && seg.op === "ins") {
          return (
            <span
              key={i}
              className="bg-emerald-200/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 rounded-sm px-0.5"
            >
              {seg.text}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}
