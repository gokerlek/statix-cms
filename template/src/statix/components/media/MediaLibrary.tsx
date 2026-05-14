"use client";

import { useEffect, useRef, useState } from "react";

import { AreYouSureDialog } from "@/statix/components/ui/are-you-sure-dialog";
import ui from "@/statix/content/ui.json";
import { useDeleteFile } from "@/statix/hooks/use-files";
import { useFilesSearch } from "@/statix/hooks/use-files-search";
import {
  type MediaFile as GitHubFile,
  useDeleteMedia,
} from "@/statix/hooks/use-media";
import { MediaTab, useMediaSearch } from "@/statix/hooks/use-media-search";
import { useMediaSelection } from "@/statix/hooks/use-media-selection";

import { MediaGrid } from "./MediaGrid";
import { type LibraryTarget, MediaToolbar } from "./MediaToolbar";
import { MoveMediaDialog } from "./MoveMediaDialog";

interface MediaLibraryProps {
  /**
   * Picker callback. Receives the public URL (what `Image`/`<a>` need)
   * and the full `MediaFile` so callers that store the R2 key (e.g.
   * `FileField`) can read `file.path` directly.
   */
  onSelect?: (url: string, file: GitHubFile) => void;
  selectedUrl?: string;
  /**
   * Library bucket. `"media"` (default) shows R2 image uploads with
   * thumbnails + folder grouping + move support. `"files"` reuses the
   * exact same shell against the R2 `files/` bucket — extension
   * grouping, file-icon cards, no move dialog (files are flat).
   */
  target?: LibraryTarget;
}

export function MediaLibrary({
  onSelect,
  selectedUrl,
  target = "media",
}: MediaLibraryProps) {
  if (target === "files") {
    return <FilesLibraryShell onSelect={onSelect} selectedUrl={selectedUrl} />;
  }

  return <MediaLibraryShell onSelect={onSelect} selectedUrl={selectedUrl} />;
}

// ── Media shell — original `MediaLibrary` body, untouched behaviour ──
function MediaLibraryShell({
  onSelect,
  selectedUrl,
}: {
  onSelect?: (url: string, file: GitHubFile) => void;
  selectedUrl?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MediaTab>("all");
  const [fileToDelete, setFileToDelete] = useState<GitHubFile | null>(null);
  const [fileToMove, setFileToMove] = useState<
    (GitHubFile & { isOrphaned?: boolean }) | null
  >(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const {
    groupedImages,
    loading,
    availableTabs,
    filteredCount,
    totalCount,
    images,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMediaSearch({ searchQuery, activeTab });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const {
    isSelectMode,
    selectedForAction,
    toggleSelect,
    toggleSelectMode,
    selectAll,
    clearSelection,
  } = useMediaSelection({ images });

  const { mutate: deleteMedia, isPending: isDeleting } = useDeleteMedia();

  const handleDeleteClick = (file: GitHubFile) => setFileToDelete(file);
  const handleMoveClick = (file: GitHubFile & { isOrphaned?: boolean }) =>
    setFileToMove(file);

  const getCurrentFolder = (path: string) => {
    const parts = path.split("/");

    return parts.length > 2 ? parts[1] : "default";
  };

  const confirmDelete = () => {
    if (!fileToDelete) return;

    deleteMedia(
      { path: fileToDelete.path, sha: fileToDelete.sha },
      { onSuccess: () => setFileToDelete(null) },
    );
  };

  const handleBulkDelete = () => {
    if (selectedForAction.size === 0) return;

    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const filesToDelete = images.filter((img) =>
      selectedForAction.has(img.path),
    );

    for (const file of filesToDelete) {
      await new Promise<void>((resolve) => {
        deleteMedia(
          { path: file.path, sha: file.sha },
          {
            onSuccess: () => resolve(),
            onError: () => resolve(),
          },
        );
      });
    }

    setIsBulkDeleting(false);
    setBulkDeleteDialogOpen(false);
    clearSelection();
  };

  return (
    <div className="space-y-6">
      <MediaToolbar
        target="media"
        activeTab={activeTab}
        onTabChange={(v) => setActiveTab(v as MediaTab)}
        availableTabs={availableTabs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSelectMode={isSelectMode}
        onToggleSelectMode={toggleSelectMode}
        selectedCount={selectedForAction.size}
        totalCount={totalCount}
        filteredCount={filteredCount}
        onSelectAll={selectAll}
        onDeleteSelected={handleBulkDelete}
        isBulkDeleting={isBulkDeleting}
        totalImagesCount={images.length}
      />

      <div className="min-h-[400px]">
        <MediaGrid
          kind="image"
          groupedImages={groupedImages}
          selectedUrl={selectedUrl}
          onSelect={onSelect}
          onDelete={handleDeleteClick}
          onMove={handleMoveClick}
          loading={loading}
          deletingFile={isDeleting ? fileToDelete : null}
          isSelectMode={isSelectMode}
          selectedForAction={selectedForAction}
          onToggleSelect={toggleSelect}
          emptyMessage={
            <>
              <div className="text-muted-foreground mb-2">
                {searchQuery
                  ? ui.mediaLibrary.noResults.replace("{query}", searchQuery)
                  : activeTab === "all"
                    ? ui.mediaLibrary.empty
                    : ui.mediaLibrary.emptyTab.replace(
                        "{tab}",
                        availableTabs.find((t) => t.id === activeTab)?.label ||
                          activeTab,
                      )}
              </div>

              {(searchQuery || activeTab !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                  className="text-primary text-sm hover:underline"
                >
                  {ui.mediaLibrary.clearFilters}
                </button>
              )}
            </>
          }
        />

        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AreYouSureDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title={ui.mediaLibrary.deleteDialogTitle}
        description={
          <span>
            {ui.mediaLibrary.deleteDialogDescription
              .split("{name}")[0]
              .replace(/<\/?strong>/g, "")}
            <strong>{fileToDelete?.name || ""}</strong>
            {(
              ui.mediaLibrary.deleteDialogDescription.split("{name}")[1] ?? ""
            ).replace(/<\/?strong>/g, "")}
          </span>
        }
        onConfirm={confirmDelete}
        confirmText={ui.common.delete}
        isLoading={isDeleting}
        loadingText={ui.common.loading}
      />

      <AreYouSureDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) =>
          !isBulkDeleting && setBulkDeleteDialogOpen(open)
        }
        title={ui.mediaLibrary.deleteDialogTitle}
        description={
          <span>
            {ui.mediaLibrary.bulkDeleteConfirm.replace(
              "{count}",
              selectedForAction.size.toString(),
            )}
          </span>
        }
        onConfirm={confirmBulkDelete}
        confirmText={ui.common.delete}
        isLoading={isBulkDeleting}
        loadingText={ui.common.loading}
      />

      {fileToMove && (
        <MoveMediaDialog
          open={!!fileToMove}
          onOpenChange={(open) => !open && setFileToMove(null)}
          media={{
            path: fileToMove.path,
            name: fileToMove.name,
            isOrphaned: fileToMove.isOrphaned,
          }}
          currentFolder={getCurrentFolder(fileToMove.path)}
        />
      )}
    </div>
  );
}

/**
 * Resolve the current folder slug for a `files/...` R2 key.
 * - `files/foo.pdf`         → "default" (root)
 * - `files/blog/foo.pdf`    → "blog"
 * Mirror of `getCurrentFolder` in `MediaLibraryShell` for the
 * `uploads/` bucket; the path math is the same, only the prefix
 * differs.
 */
function getFilesFolder(path: string): string {
  const parts = path.split("/");

  return parts.length > 2 ? parts[1] : "default";
}

// ── Files shell — same shell, swapped data layer + files-aware move ──
function FilesLibraryShell({
  onSelect,
  selectedUrl,
}: {
  onSelect?: (url: string, file: GitHubFile) => void;
  selectedUrl?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [fileToDelete, setFileToDelete] = useState<GitHubFile | null>(null);
  const [fileToMove, setFileToMove] = useState<
    (GitHubFile & { isOrphaned?: boolean }) | null
  >(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const {
    groupedImages,
    loading,
    availableTabs,
    filteredCount,
    totalCount,
    images,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFilesSearch({ searchQuery, activeTab });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const {
    isSelectMode,
    selectedForAction,
    toggleSelect,
    toggleSelectMode,
    selectAll,
    clearSelection,
  } = useMediaSelection({ images });

  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();

  const confirmDelete = () => {
    if (!fileToDelete) return;

    deleteFile(fileToDelete.path, {
      onSuccess: () => setFileToDelete(null),
    });
  };

  const handleBulkDelete = () => {
    if (selectedForAction.size === 0) return;

    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsBulkDeleting(true);
    const filesToDelete = images.filter((img) =>
      selectedForAction.has(img.path),
    );

    for (const file of filesToDelete) {
      await new Promise<void>((resolve) => {
        deleteFile(file.path, {
          onSuccess: () => resolve(),
          onError: () => resolve(),
        });
      });
    }

    setIsBulkDeleting(false);
    setBulkDeleteDialogOpen(false);
    clearSelection();
  };

  return (
    <div className="space-y-6">
      <MediaToolbar
        target="files"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        availableTabs={availableTabs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSelectMode={isSelectMode}
        onToggleSelectMode={toggleSelectMode}
        selectedCount={selectedForAction.size}
        totalCount={totalCount}
        filteredCount={filteredCount}
        onSelectAll={selectAll}
        onDeleteSelected={handleBulkDelete}
        isBulkDeleting={isBulkDeleting}
        totalImagesCount={images.length}
      />

      <div className="min-h-[400px]">
        <MediaGrid
          kind="file"
          groupedImages={groupedImages}
          selectedUrl={selectedUrl}
          onSelect={onSelect}
          onDelete={(f) => setFileToDelete(f)}
          onMove={(f) => setFileToMove(f)}
          loading={loading}
          deletingFile={isDeleting ? fileToDelete : null}
          isSelectMode={isSelectMode}
          selectedForAction={selectedForAction}
          onToggleSelect={toggleSelect}
          emptyMessage={
            <>
              <div className="text-muted-foreground mb-2">
                {searchQuery
                  ? ui.filesPage.noResults.replace("{query}", searchQuery)
                  : activeTab === "all"
                    ? ui.filesPage.emptyTitle
                    : ui.filesPage.emptyTab.replace(
                        "{tab}",
                        availableTabs.find((t) => t.id === activeTab)?.label ||
                          activeTab,
                      )}
              </div>

              {(searchQuery || activeTab !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveTab("all");
                  }}
                  className="text-primary text-sm hover:underline"
                >
                  {ui.mediaLibrary.clearFilters}
                </button>
              )}
            </>
          }
        />

        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <AreYouSureDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title={ui.filesPage.deleteDialogTitle}
        description={
          <span>
            {ui.filesPage.deleteDialogDescription
              .split("{name}")[0]
              .replace(/<\/?strong>/g, "")}
            <strong>{fileToDelete?.name || ""}</strong>
            {(
              ui.filesPage.deleteDialogDescription.split("{name}")[1] ?? ""
            ).replace(/<\/?strong>/g, "")}
          </span>
        }
        onConfirm={confirmDelete}
        confirmText={ui.common.delete}
        isLoading={isDeleting}
        loadingText={ui.common.loading}
      />

      <AreYouSureDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) =>
          !isBulkDeleting && setBulkDeleteDialogOpen(open)
        }
        title={ui.filesPage.bulkDeleteDialogTitle}
        description={ui.filesPage.bulkDeleteConfirm.replace(
          "{count}",
          selectedForAction.size.toString(),
        )}
        onConfirm={confirmBulkDelete}
        confirmText={ui.common.delete}
        isLoading={isBulkDeleting}
        loadingText={ui.common.loading}
      />

      {fileToMove && (
        <MoveMediaDialog
          target="files"
          open={!!fileToMove}
          onOpenChange={(open) => !open && setFileToMove(null)}
          media={{
            path: fileToMove.path,
            name: fileToMove.name,
            isOrphaned: fileToMove.isOrphaned,
          }}
          currentFolder={getFilesFolder(fileToMove.path)}
        />
      )}
    </div>
  );
}
