import { useCallback, useState } from "react";

import { GitHubFile } from "@/lib/github-cms";

interface UseMediaSelectionProps {
  images: GitHubFile[];
}

export function useMediaSelection({ images }: UseMediaSelectionProps) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedForAction, setSelectedForAction] = useState<Set<string>>(
    new Set(),
  );

  const toggleSelect = useCallback((file: GitHubFile) => {
    setSelectedForAction((prev) => {
      const newSelected = new Set(prev);

      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.add(file.path);
      }

      return newSelected;
    });
  }, []);

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) {
        // Exiting select mode, clear selection
        setSelectedForAction(new Set());
      }

      return !prev;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedForAction((prev) => {
      if (prev.size === images.length) {
        return new Set();
      } else {
        return new Set(images.map((img) => img.path));
      }
    });
  }, [images]);

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
