"use client";

import { createElement } from "react";

import {
  IconAlertCircle,
  IconCircleCheck,
  IconDownload,
  IconFolderOpen,
  IconTrash,
} from "@tabler/icons-react";

import ui from "@/statix/content/ui.json";
import {
  getExtension,
  getExtensionColor,
  getTypeIcon,
} from "@/statix/lib/file-icons";
import { cn, formatFileSize } from "@/statix/lib/utils";

import type { MediaFile } from "@/statix/hooks/use-media";

interface MediaItemProps {
  file: MediaFile & { isOrphaned?: boolean };
  isSelected: boolean;
  onSelect?: (url: string, file: MediaFile) => void;
  onDelete: (file: MediaFile) => void;
  onMove?: (file: MediaFile) => void;
  isDeleting?: boolean;
  isSelectMode?: boolean;
  isSelectedForAction?: boolean;
  onToggleSelect?: (file: MediaFile) => void;
  /**
   * `"image"` (default) renders the R2 thumbnail via `/api/media/serve`.
   * `"file"` renders an extension-tinted Tabler icon tile + filename —
   * used by the Files library where rows are documents/archives, not
   * thumbnails. The rest of the card chrome (orphan badge, selection
   * checkbox, hover actions) is identical so Media + Files share the
   * exact same interaction model.
   */
  kind?: "image" | "file";
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
  kind = "image",
}: MediaItemProps) {
  const isFile = kind === "file";

  // Serve route üzerinden proxy — NEXT_PUBLIC_MEDIA_BASE_URL'den bağımsız, her zaman çalışır
  const imageUrl = `/api/media/serve/${file.path}`;
  // onSelect'e R2 public URL gönder (content'te saklanacak değer)
  const selectUrl = file.url || `/${file.path.replace(/^public\//, "")}`;

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectMode) {
      e.preventDefault();
      onToggleSelect?.(file);
    } else {
      onSelect?.(selectUrl, file);
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
      {isFile ? (
        <FileIconTile name={file.name} size={file.size} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={file.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

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
          <IconAlertCircle className="w-3 h-3" />
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
          <IconCircleCheck className="w-4 h-4" />
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between",
          isDeleting && "opacity-0 group-hover:opacity-0",
          isSelectMode && "opacity-0 group-hover:opacity-0",
        )}
      >
        <p className="text-xs text-white truncate flex-1 mr-2">{file.name}</p>

        <div className="flex items-center gap-1">
          {isFile && file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="text-white/80 hover:text-blue-300 transition-colors p-1"
              onClick={(e) => e.stopPropagation()}
              title={ui.filesPage.download}
              aria-label={ui.filesPage.download}
            >
              <IconDownload className="w-4 h-4" />
            </a>
          )}

          {onMove && (
            <button
              className="text-white/80 hover:text-blue-400 transition-colors p-1"
              onClick={(e) => {
                e.stopPropagation();
                onMove(file);
              }}
              title={ui.common.changeFolder}
              aria-label={ui.common.changeFolder}
            >
              <IconFolderOpen className="w-4 h-4" />
            </button>
          )}

          <button
            className="text-white/80 hover:text-red-400 transition-colors p-1"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file);
            }}
            title={ui.common.delete}
            aria-label={ui.common.delete}
          >
            <IconTrash className="w-4 h-4" />
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

// Module-scope helper. Uses `React.createElement` so the icon
// component is referenced by value rather than captured as a const +
// JSX'd — sidesteps `react-hooks/static-components` which flags
// dynamic component creation inside a render body.
function FileIconTile({ name, size }: { name: string; size: number }) {
  const ext = getExtension(name);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-secondary/40">
      {createElement(getTypeIcon(ext), {
        className: cn("w-12 h-12 mb-2", getExtensionColor(ext)),
        "aria-hidden": true,
      })}
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {ext || "FILE"}
      </span>
      <span className="text-[10px] text-muted-foreground tabular-nums">
        {formatFileSize(size)}
      </span>
    </div>
  );
}
