import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useListSelection } from "@/statix/hooks/use-list-selection";

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
];

const keyOf = (r: Row) => r.id;

describe("useListSelection", () => {
  it("starts with select mode off and an empty set", () => {
    const { result } = renderHook(() => useListSelection(ROWS, keyOf));

    expect(result.current.isSelectMode).toBe(false);
    expect(result.current.selectedForAction.size).toBe(0);
  });

  it("toggleSelect adds and removes individual items", () => {
    const { result } = renderHook(() => useListSelection(ROWS, keyOf));

    act(() => result.current.toggleSelect(ROWS[0]));
    expect(result.current.selectedForAction.has("a")).toBe(true);

    act(() => result.current.toggleSelect(ROWS[1]));
    expect(result.current.selectedForAction.size).toBe(2);

    act(() => result.current.toggleSelect(ROWS[0]));
    expect(result.current.selectedForAction.has("a")).toBe(false);
    expect(result.current.selectedForAction.has("b")).toBe(true);
  });

  it("toggleSelectMode flips the flag and clears the set on exit", () => {
    const { result } = renderHook(() => useListSelection(ROWS, keyOf));

    act(() => result.current.toggleSelectMode());
    expect(result.current.isSelectMode).toBe(true);

    act(() => result.current.toggleSelect(ROWS[0]));
    expect(result.current.selectedForAction.size).toBe(1);

    act(() => result.current.toggleSelectMode());
    expect(result.current.isSelectMode).toBe(false);
    expect(result.current.selectedForAction.size).toBe(0);
  });

  it("selectAll selects every item; calling again clears the set", () => {
    const { result } = renderHook(() => useListSelection(ROWS, keyOf));

    act(() => result.current.selectAll());
    expect(result.current.selectedForAction.size).toBe(3);
    expect(result.current.selectedForAction.has("a")).toBe(true);
    expect(result.current.selectedForAction.has("b")).toBe(true);
    expect(result.current.selectedForAction.has("c")).toBe(true);

    act(() => result.current.selectAll());
    expect(result.current.selectedForAction.size).toBe(0);
  });

  it("clearSelection drops both the set and select-mode flag", () => {
    const { result } = renderHook(() => useListSelection(ROWS, keyOf));

    act(() => result.current.toggleSelectMode());
    act(() => result.current.toggleSelect(ROWS[2]));
    expect(result.current.isSelectMode).toBe(true);
    expect(result.current.selectedForAction.size).toBe(1);

    act(() => result.current.clearSelection());
    expect(result.current.isSelectMode).toBe(false);
    expect(result.current.selectedForAction.size).toBe(0);
  });

  it("respects the keyOf extractor — different shapes can share the hook", () => {
    interface ByPath {
      path: string;
      label: string;
    }
    const byPath: ByPath[] = [
      { path: "uploads/a.jpg", label: "A" },
      { path: "uploads/b.jpg", label: "B" },
    ];
    const { result } = renderHook(() =>
      useListSelection(byPath, (item) => item.path),
    );

    act(() => result.current.toggleSelect(byPath[0]));
    expect(result.current.selectedForAction.has("uploads/a.jpg")).toBe(true);
    expect(result.current.selectedForAction.has("uploads/b.jpg")).toBe(false);
  });
});
