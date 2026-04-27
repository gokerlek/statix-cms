import { useCallback } from "react";

import { GitHubFile } from "@/statix/lib/github-cms";

import { useListSelection } from "./use-list-selection";

interface UseMediaSelectionProps {
  images: GitHubFile[];
}

/**
 * Media-library selection wrapper. Delegates to the generic
 * `useListSelection` hook so Media + Files share one implementation.
 * The public return shape is preserved verbatim for backward compat
 * with existing `MediaLibrary` / `MediaGrid` / `MediaItem` call-sites.
 */
export function useMediaSelection({ images }: UseMediaSelectionProps) {
  const keyOf = useCallback((file: GitHubFile) => file.path, []);
  const selection = useListSelection(images, keyOf);

  return selection;
}
