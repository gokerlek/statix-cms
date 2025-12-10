"use client";

import { AlertCircle, CheckCircle2, FolderOpen, Trash2 } from "lucide-react";

import ui from "@/content/ui.json";
import { GitHubFile } from "@/lib/github-cms";
import { cn, getGitHubRawUrl } from "@/lib/utils";

interface MediaItemProps {
  file: GitHubFile & { isOrphaned?: boolean };
  isSelected: boolean;
  onSelect?: (url: string) => void;
  onDelete: (file: GitHubFile) => void;
  onMove?: (file: GitHubFile) => void;
  isDeleting?: boolean;
  isSelectMode?: boolean;
  isSelectedForAction?: boolean;
  onToggleSelect?: (file: GitHubFile) => void;
}

export function MediaItem({
  file,
  isSelected,
  onSelect,
  onDelete,
  onMove,
  isDeleting,
  isSelectMode,
  isSelectedForAction,
  onToggleSelect,
}: MediaItemProps) {
  const url = `/${file.path.replace(/^public\//, "")}`;
  // Use the URL from API if available, otherwise fallback to GitHub raw URL
  const imageUrl = file.url || getGitHubRawUrl(file.path);

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectMode) {
      e.preventDefault();
      onToggleSelect?.(file);
    } else {
      onSelect?.(url);
    }
  };

  return (
    <div
      className={cn(
        "group relative aspect-square bg-muted rounded-lg overflow-hidden border cursor-pointer transition-all hover:ring-2 hover:ring-primary",
        isSelected && "ring-2 ring-primary",
        isSelectedForAction && "ring-2 ring-primary bg-primary/10",
        isDeleting && "opacity-70 pointer-events-none",
      )}
      onClick={handleClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={file.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Orphaned Indicator */}
      {file.isOrphaned && !isSelectMode && (
        <div
          className="absolute top-2 left-2 bg-yellow-500/90 text-white rounded-full p-1 shadow-sm"
          title={ui.mediaLibrary.orphaned}
        >
          <AlertCircle className="w-3 h-3" />
        </div>
      )}

      {/* Selection Indicator */}
      {isSelectMode && (
        <div
          className={cn(
            "absolute top-2 left-2 rounded-full p-1 shadow-sm transition-colors",
            isSelectedForAction
              ? "bg-primary text-primary-foreground"
              : "bg-black/40 text-white hover:bg-black/60",
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between",
          isDeleting && "opacity-0 group-hover:opacity-0",
          isSelectMode && "opacity-0 group-hover:opacity-0", // Hide actions in select mode
        )}
      >
        <p className="text-xs text-white truncate flex-1 mr-2">{file.name}</p>

        <div className="flex items-center gap-1">
          {onMove && (
            <button
              className="text-white/80 hover:text-blue-400 transition-colors p-1"
              onClick={(e) => {
                e.stopPropagation();
                onMove(file);
              }}
              title="Klasör Değiştir"
              aria-label="Move to folder"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}

          <button
            className="text-white/80 hover:text-red-400 transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file);
            }}
            title="Delete"
            aria-label="Delete image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isSelected && !isSelectMode && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
