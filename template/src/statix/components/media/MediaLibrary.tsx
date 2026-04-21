"use client";

import { useEffect, useRef, useState } from "react";

import { AreYouSureDialog } from "@/statix/components/ui/are-you-sure-dialog";
import ui from "@/statix/content/ui.json";
import { useDeleteMedia } from "@/statix/hooks/use-media";
import { MediaTab, useMediaSearch } from "@/statix/hooks/use-media-search";
import { useMediaSelection } from "@/statix/hooks/use-media-selection";
import type { MediaFile as GitHubFile } from "@/statix/hooks/use-media";

import { MediaGrid } from "./MediaGrid";
import { MediaToolbar } from "./MediaToolbar";
import { MoveMediaDialog } from "./MoveMediaDialog";

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  selectedUrl?: string;
}

export function MediaLibrary({ onSelect, selectedUrl }: MediaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MediaTab>("all");
  const [fileToDelete, setFileToDelete] = useState<GitHubFile | null>(null);
  const [fileToMove, setFileToMove] = useState<(GitHubFile & { isOrphaned?: boolean }) | null>(null);
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
  const handleMoveClick = (file: GitHubFile & { isOrphaned?: boolean }) => setFileToMove(file);

  // Extract current folder from file path
  const getCurrentFolder = (path: string) => {
    // path = "uploads/folder/filename.jpg" veya "uploads/filename.jpg"
    const parts = path.split("/");
    // parts[0] = "uploads", parts[1] = folder veya filename
    return parts.length > 2 ? parts[1] : "default";
  };

  const confirmDelete = () => {
    if (!fileToDelete) return;

    deleteMedia(
      { path: fileToDelete.path, sha: fileToDelete.sha },
      {
        onSuccess: () => {
          setFileToDelete(null);
        },
      },
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

    // Delete it sequentially to avoid rate limits or conflicts
    for (const file of filesToDelete) {
      await new Promise<void>((resolve) => {
        deleteMedia(
          { path: file.path, sha: file.sha },
          {
            onSuccess: () => resolve(),
            onError: () => resolve(), // Continue even if one fails
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

      {/* Media Grid */}
      <div className="min-h-[400px]">
        <MediaGrid
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

        {/* Infinite scroll sentinel */}
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
            {(ui.mediaLibrary.deleteDialogDescription.split("{name}")[1] ?? "")
              .replace(/<\/?strong>/g, "")}
          </span>
        }
        onConfirm={confirmDelete}
        confirmText={ui.common.delete}
        isLoading={isDeleting}
        loadingText={ui.common.loading}
      />

      <AreYouSureDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={(open) => !isBulkDeleting && setBulkDeleteDialogOpen(open)}
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
