/**
 * Shared field-diff helpers.
 *
 * These utilities are the single source of truth for:
 *  - walking a dotted form path (`translations.en.title`) into a plain object,
 *  - comparing two JSON-shaped values for structural equality (used by the
 *    dirty indicator so referential churn inside react-hook-form doesn't
 *    produce false positives),
 *  - computing added / removed / modified / moved deltas between two arrays
 *    of identifiable items (list & block editors).
 *
 * Anything field-level that needs "did this change?" goes through here.
 */

/** Items that can appear inside a `list` or `blocks` field. */
export interface IdentifiableItem extends Record<string, unknown> {
  id: string;
}

// ── Path / structural helpers ─────────────────────────────────────────

/**
 * Walk a dotted path into a plain object and return whatever is at the end.
 * `translations.en.title` on `{ translations: { en: { title: "X" } } }` → `"X"`.
 * Returns `undefined` when any hop is missing.
 */
export function getByPath(obj: unknown, path: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * Deep structural equality for JSON-shaped values. Used instead of `===`
 * because react-hook-form replaces arrays/objects on every keystroke in
 * some field types — a referential compare would always report "dirty".
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== "object" || typeof b !== "object") return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  const ka = Object.keys(a as Record<string, unknown>);
  const kb = Object.keys(b as Record<string, unknown>);
  if (ka.length !== kb.length) return false;
  return ka.every((k) =>
    deepEqual(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
    ),
  );
}

// ── List / blocks diff ────────────────────────────────────────────────

export interface ListDiffModified {
  id: string;
  oldIndex: number;
  newIndex: number;
  oldItem: IdentifiableItem;
  newItem: IdentifiableItem;
  /** Root-level keys (excluding `id`) whose value differs between old and new. */
  changedKeys: string[];
}

export interface ListDiffMoved {
  id: string;
  item: IdentifiableItem;
  from: number;
  to: number;
}

export interface ListDiffResult {
  added: Array<{ id: string; item: IdentifiableItem; index: number }>;
  removed: Array<{ id: string; item: IdentifiableItem; index: number }>;
  modified: ListDiffModified[];
  moved: ListDiffMoved[];
  /** `true` when none of the above contain entries — saves re-render work. */
  unchanged: boolean;
}

/**
 * Ensure every input has an `id`. Items missing an id (legacy content
 * written before UUIDs were enforced) are paired positionally by wrapping
 * them in synthetic `__idx-N` ids. This keeps the algorithm total, but
 * callers should know modified-vs-moved detection degrades for those
 * items.
 */
function normalize(items: unknown[] | undefined | null): IdentifiableItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw, idx) => {
    if (
      raw != null &&
      typeof raw === "object" &&
      typeof (raw as { id?: unknown }).id === "string" &&
      ((raw as { id: string }).id).length > 0
    ) {
      return raw as IdentifiableItem;
    }
    const obj = (raw != null && typeof raw === "object")
      ? (raw as Record<string, unknown>)
      : {};
    return { ...obj, id: `__idx-${idx}` };
  });
}

function changedKeysBetween(a: IdentifiableItem, b: IdentifiableItem): string[] {
  const keys = new Set<string>();
  for (const k of Object.keys(a)) if (k !== "id") keys.add(k);
  for (const k of Object.keys(b)) if (k !== "id") keys.add(k);
  const diffs: string[] = [];
  for (const k of keys) {
    if (!deepEqual(a[k], b[k])) diffs.push(k);
  }
  return diffs;
}

/**
 * Compute a structured diff between two lists of identifiable items.
 *
 *  - `added`     — id present in `next` but not `old`
 *  - `removed`   — id present in `old` but not `next`
 *  - `modified`  — same id on both sides, any non-`id` key differs
 *  - `moved`     — same id on both sides, contents equal, position changed
 *
 * A single item can be both `modified` AND `moved` in practice; we emit it
 * only in the strongest category (`modified`) so the UI doesn't show two
 * cards for one change.
 */
export function diffListItems(
  oldItems: unknown[] | undefined | null,
  nextItems: unknown[] | undefined | null,
): ListDiffResult {
  const oldList = normalize(oldItems);
  const nextList = normalize(nextItems);

  const oldById = new Map<string, { item: IdentifiableItem; index: number }>();
  oldList.forEach((item, index) => oldById.set(item.id, { item, index }));

  const nextById = new Map<string, { item: IdentifiableItem; index: number }>();
  nextList.forEach((item, index) => nextById.set(item.id, { item, index }));

  const added: ListDiffResult["added"] = [];
  const removed: ListDiffResult["removed"] = [];
  const modified: ListDiffModified[] = [];
  const moved: ListDiffMoved[] = [];

  for (const [id, { item, index }] of nextById) {
    const prev = oldById.get(id);
    if (!prev) {
      added.push({ id, item, index });
      continue;
    }
    const changedKeys = changedKeysBetween(prev.item, item);
    if (changedKeys.length > 0) {
      modified.push({
        id,
        oldIndex: prev.index,
        newIndex: index,
        oldItem: prev.item,
        newItem: item,
        changedKeys,
      });
    } else if (prev.index !== index) {
      moved.push({ id, item, from: prev.index, to: index });
    }
  }

  for (const [id, { item, index }] of oldById) {
    if (!nextById.has(id)) removed.push({ id, item, index });
  }

  const unchanged =
    added.length === 0 &&
    removed.length === 0 &&
    modified.length === 0 &&
    moved.length === 0;

  return { added, removed, modified, moved, unchanged };
}
