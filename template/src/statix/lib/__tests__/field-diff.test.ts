import { describe, expect, it } from "vitest";

import {
  deepEqual,
  diffListItems,
  getByPath,
} from "@/statix/lib/field-diff";

describe("getByPath", () => {
  it("walks dotted paths", () => {
    expect(getByPath({ a: { b: { c: 42 } } }, "a.b.c")).toBe(42);
  });

  it("returns undefined for missing hops", () => {
    expect(getByPath({ a: {} }, "a.b.c")).toBeUndefined();
  });

  it("returns undefined for non-object roots", () => {
    expect(getByPath("hello", "a")).toBeUndefined();
    expect(getByPath(null, "a")).toBeUndefined();
  });

  it("works for top-level keys", () => {
    expect(getByPath({ title: "X" }, "title")).toBe("X");
  });
});

describe("deepEqual", () => {
  it("treats primitives with === semantics", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("compares arrays by content", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("compares objects by keys + values", () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("recurses through nested shapes", () => {
    const a = { items: [{ id: "1", title: "A" }] };
    const b = { items: [{ id: "1", title: "A" }] };
    expect(deepEqual(a, b)).toBe(true);
    const c = { items: [{ id: "1", title: "B" }] };
    expect(deepEqual(a, c)).toBe(false);
  });
});

describe("diffListItems", () => {
  it("reports unchanged when both lists are empty", () => {
    const result = diffListItems([], []);
    expect(result.unchanged).toBe(true);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.modified).toEqual([]);
    expect(result.moved).toEqual([]);
  });

  it("reports unchanged when lists are structurally identical", () => {
    const items = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    const result = diffListItems(items, items);
    expect(result.unchanged).toBe(true);
  });

  it("detects appended items", () => {
    const a = [{ id: "1", label: "A" }];
    const b = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    const result = diffListItems(a, b);
    expect(result.added).toHaveLength(1);
    expect(result.added[0]!.id).toBe("2");
    expect(result.added[0]!.index).toBe(1);
    expect(result.removed).toEqual([]);
  });

  it("detects removed items", () => {
    const a = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    const b = [{ id: "1", label: "A" }];
    const result = diffListItems(a, b);
    expect(result.removed).toHaveLength(1);
    expect(result.removed[0]!.id).toBe("2");
  });

  it("detects field-level modifications with changedKeys", () => {
    const a = [{ id: "1", label: "A", color: "gray" }];
    const b = [{ id: "1", label: "A", color: "blue" }];
    const result = diffListItems(a, b);
    expect(result.modified).toHaveLength(1);
    expect(result.modified[0]!.changedKeys).toEqual(["color"]);
  });

  it("detects moves without content change", () => {
    const a = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    const b = [
      { id: "2", label: "B" },
      { id: "1", label: "A" },
    ];
    const result = diffListItems(a, b);
    expect(result.moved).toHaveLength(2);
    expect(result.modified).toEqual([]);
  });

  it("prefers `modified` over `moved` when both apply", () => {
    const a = [
      { id: "1", label: "A" },
      { id: "2", label: "B" },
    ];
    const b = [
      { id: "2", label: "B-edited" },
      { id: "1", label: "A" },
    ];
    const result = diffListItems(a, b);
    expect(result.modified.map((m) => m.id)).toEqual(["2"]);
    // "2" isn't doubly-counted in moved even though its index changed.
    expect(result.moved.map((m) => m.id)).not.toContain("2");
  });

  it("normalizes legacy items missing an id into synthetic positional ids", () => {
    const a = [{ label: "legacy" }];
    const b = [{ label: "legacy" }];
    // Both items normalize to `__idx-0` with identical content → unchanged.
    expect(diffListItems(a, b).unchanged).toBe(true);
  });

  it("handles null / undefined inputs without throwing", () => {
    expect(diffListItems(null, null).unchanged).toBe(true);
    expect(diffListItems(undefined, []).unchanged).toBe(true);
    expect(
      diffListItems(null, [{ id: "1", label: "A" }]).added,
    ).toHaveLength(1);
  });

  it("mixes adds / removes / modifies / moves in one pass", () => {
    const a = [
      { id: "keep", label: "Keep" },
      { id: "edit", label: "Old" },
      { id: "drop", label: "Remove" },
      { id: "reorder", label: "Reorder" },
    ];
    const b = [
      { id: "reorder", label: "Reorder" },
      { id: "keep", label: "Keep" },
      { id: "edit", label: "New" },
      { id: "new", label: "New" },
    ];
    const result = diffListItems(a, b);
    expect(result.added.map((x) => x.id)).toEqual(["new"]);
    expect(result.removed.map((x) => x.id)).toEqual(["drop"]);
    expect(result.modified.map((x) => x.id)).toEqual(["edit"]);
    expect(result.moved.map((x) => x.id).sort()).toEqual(["keep", "reorder"]);
  });
});
