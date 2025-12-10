"use client";

import { GitHubFile } from "@/lib/github-cms";

import { MediaGridSkeleton } from "../skeletons";
import { MediaItem } from "./MediaItem";

interface MediaGridProps {
  groupedImages: Record<string, GitHubFile[]>;
  selectedUrl?: string;
  onSelect?: (url: string) => void;
  onDelete: (file: GitHubFile) => void;
  onMove?: (file: GitHubFile & { isOrphaned?: boolean }) => void;
  loading: boolean;
  emptyMessage: React.ReactNode;
  deletingFile?: GitHubFile | null;
  isSelectMode?: boolean;
  selectedForAction?: Set<string>;
  onToggleSelect?: (file: GitHubFile) => void;
}

export function MediaGrid({
  groupedImages,
  selectedUrl,
  onSelect,
  onDelete,
  onMove,
  loading,
  emptyMessage,
  deletingFile,
  isSelectMode,
  selectedForAction,
  onToggleSelect,
}: MediaGridProps) {
  if (loading) {
    return <MediaGridSkeleton items={12} />;
  }

  if (Object.keys(groupedImages).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedImages).map(([folder, groupImages]) => (
        <div key={folder}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2">
            {folder} ({groupImages.length})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {groupImages.map((file) => (
              <MediaItem
                key={file.path}
                file={file}
                isSelected={
                  selectedUrl === `/${file.path.replace(/^public\//, "")}`
                }
                onSelect={onSelect}
                onDelete={onDelete}
                onMove={onMove}
                isDeleting={deletingFile?.sha === file.sha}
                isSelectMode={isSelectMode}
                isSelectedForAction={selectedForAction?.has(file.path)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
