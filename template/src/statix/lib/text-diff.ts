/**
 * Word-level text diff — thin wrapper over `diff-match-patch`.
 *
 * Exposed as a dynamic-import surface (`loadDiffWords()`) so the ~40 KB
 * dmp bundle only hits the wire when the user actually opens the
 * "Değişiklikleri gör" drawer. Callers that care about synchronous access
 * can also import `diffWords` directly — it's the same function.
 */

export type DiffOp = "eq" | "ins" | "del";

export interface DiffSegment {
  op: DiffOp;
  text: string;
}

interface DmpInstance {
  diff_main(
    a: string,
    b: string,
    checklines?: boolean,
  ): Array<[number, string]>;
  diff_cleanupSemantic(diffs: Array<[number, string]>): void;
}

let dmpPromise: Promise<DmpInstance> | null = null;

/** Lazily import `diff-match-patch` and return a reusable instance. */
async function getDmp(): Promise<DmpInstance> {
  if (!dmpPromise) {
    dmpPromise = import("diff-match-patch").then((mod) => {
      const Ctor =
        (mod as unknown as { diff_match_patch?: new () => DmpInstance })
          .diff_match_patch ??
        (mod as unknown as { default?: new () => DmpInstance }).default;
      if (!Ctor) {
        throw new Error(
          "diff-match-patch export shape unexpected; check dynamic import",
        );
      }
      return new Ctor();
    });
  }
  return dmpPromise;
}

const DMP_DELETE = -1;
const DMP_INSERT = 1;
const DMP_EQUAL = 0;

function toSegment([op, text]: [number, string]): DiffSegment {
  if (op === DMP_INSERT) return { op: "ins", text };
  if (op === DMP_DELETE) return { op: "del", text };
  if (op === DMP_EQUAL) return { op: "eq", text };
  // Unknown op — fall back to "equal" so nothing is hidden accidentally.
  return { op: "eq", text };
}

/**
 * Diff two strings at character granularity, then run
 * `diff_cleanupSemantic` so the output reads in human-sized chunks
 * (whole words / short phrases) instead of individual characters.
 */
export async function diffWords(a: string, b: string): Promise<DiffSegment[]> {
  if (a === b) return [{ op: "eq", text: a }];
  const dmp = await getDmp();
  const raw = dmp.diff_main(a ?? "", b ?? "");
  dmp.diff_cleanupSemantic(raw);
  return raw.map(toSegment);
}

/** One-line summary used in the drawer header ("3 kelime eklendi · 1 silindi"). */
export function summarizeDiff(segments: DiffSegment[]): {
  insertions: number;
  deletions: number;
} {
  let insertions = 0;
  let deletions = 0;
  for (const seg of segments) {
    if (seg.op === "ins") insertions += countWords(seg.text);
    else if (seg.op === "del") deletions += countWords(seg.text);
  }
  return { insertions, deletions };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * A single row in a GitHub-style side-by-side diff. Kind drives the visual
 * presentation; `word` carries inline word-level segments for `modified`
 * rows so consumers can render red / green highlights inside the row.
 */
export type LineDiffRow =
  | { kind: "equal"; left: string; right: string; lineLeft: number; lineRight: number }
  | {
      kind: "modified";
      left: string;
      right: string;
      leftSegments: DiffSegment[];
      rightSegments: DiffSegment[];
      lineLeft: number;
      lineRight: number;
    }
  | { kind: "added"; right: string; lineRight: number }
  | { kind: "removed"; left: string; lineLeft: number };

interface DmpLineInstance extends DmpInstance {
  // These are documented as "private" in dmp but are the supported way to
  // drop the cost of per-character diff on big documents.
  // https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs
  diff_linesToChars_(
    text1: string,
    text2: string,
  ): { chars1: string; chars2: string; lineArray: string[] };
  diff_charsToLines_(diffs: Array<[number, string]>, lineArray: string[]): void;
}

async function getDmpLine(): Promise<DmpLineInstance> {
  const dmp = (await getDmp()) as DmpLineInstance;
  return dmp;
}

/** Split a diff segment's text into trailing-newline chunks so we can align
 *  rows one-to-one between the two sides. */
function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  const lines = text.split("\n");
  // `diff_linesToChars_` always terminates with a newline, so the last
  // split produces an empty trailing string — drop it.
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/**
 * GitHub-style line diff between two arrays of text lines. Each row ends up
 * as one of:
 *   - `equal`    → identical on both sides
 *   - `modified` → same row index on both sides, contents differ; inner
 *                  word-level segments included so the UI can highlight the
 *                  changed words inline
 *   - `added`    → present only on the right
 *   - `removed`  → present only on the left
 *
 * Delete / Insert segments emitted consecutively by `diff-match-patch` are
 * paired up one-for-one into `modified` rows so side-by-side rendering has
 * the classic red / green facing layout instead of two unrelated stacks.
 */
export async function diffLines(
  leftLines: string[],
  rightLines: string[],
): Promise<LineDiffRow[]> {
  const dmp = await getDmpLine();
  const text1 = leftLines.join("\n") + (leftLines.length ? "\n" : "");
  const text2 = rightLines.join("\n") + (rightLines.length ? "\n" : "");

  const { chars1, chars2, lineArray } = dmp.diff_linesToChars_(text1, text2);
  const raw = dmp.diff_main(chars1, chars2, false);
  dmp.diff_charsToLines_(raw, lineArray);

  // Walk the segment list into aligned rows.
  const rows: LineDiffRow[] = [];
  let pendingDeletes: string[] = [];
  let cursorLeft = 0;
  let cursorRight = 0;

  const flushDeletes = () => {
    for (const line of pendingDeletes) {
      rows.push({ kind: "removed", left: line, lineLeft: ++cursorLeft });
    }
    pendingDeletes = [];
  };

  for (const [op, text] of raw) {
    const lines = splitLines(text);
    if (op === DMP_EQUAL) {
      flushDeletes();
      for (const line of lines) {
        rows.push({
          kind: "equal",
          left: line,
          right: line,
          lineLeft: ++cursorLeft,
          lineRight: ++cursorRight,
        });
      }
    } else if (op === DMP_DELETE) {
      for (const line of lines) pendingDeletes.push(line);
    } else if (op === DMP_INSERT) {
      for (const line of lines) {
        const paired = pendingDeletes.shift();
        if (paired !== undefined) {
          // Inner word diff so UI can render red-on-left / green-on-right.
          const inner = await diffWords(paired, line);
          const leftSegs = inner.filter((s) => s.op !== "ins");
          const rightSegs = inner.filter((s) => s.op !== "del");
          rows.push({
            kind: "modified",
            left: paired,
            right: line,
            leftSegments: leftSegs,
            rightSegments: rightSegs,
            lineLeft: ++cursorLeft,
            lineRight: ++cursorRight,
          });
        } else {
          rows.push({ kind: "added", right: line, lineRight: ++cursorRight });
        }
      }
    }
  }
  flushDeletes();

  return rows;
}
