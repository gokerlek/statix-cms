import { useCallback, useState } from "react";

/**
 * Generic selection hook shared by Media + File libraries. Gives components
 * a Set-backed multi-select model with the usual toggle / selectAll /
 * clear semantics without forcing a particular item shape — callers pass
 * a `keyOf` extractor (e.g. `img.path`, `file.key`) that decides what
 * identifies each item.
 *
 * Paired with `useMediaSelection` (thin wrapper for GitHubFile) and
 * `useFilesSelection` (thin wrapper for FileItem) — this is the single
 * implementation both delegate to.
 */
export function useListSelection<T>(items: T[], keyOf: (item: T) => string) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedForAction, setSelectedForAction] = useState<Set<string>>(
    new Set(),
  );

  const toggleSelect = useCallback(
    (item: T) => {
      setSelectedForAction((prev) => {
        const next = new Set(prev);
        const key = keyOf(item);

        if (next.has(key)) next.delete(key);
        else next.add(key);

        return next;
      });
    },
    [keyOf],
  );

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) setSelectedForAction(new Set());

      return !prev;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedForAction((prev) => {
      if (prev.size === items.length) return new Set();

      return new Set(items.map(keyOf));
    });
  }, [items, keyOf]);

  const clearSelection = useCallback(() => {
    setSelectedForAction(new Set());
    setIsSelectMode(false);
  }, []);

  return {
    isSelectMode,
    selectedForAction,
    toggleSelect,
    toggleSelectMode,
    selectAll,
    clearSelection,
    setIsSelectMode,
    setSelectedForAction,
  };
}
