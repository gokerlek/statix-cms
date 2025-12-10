"use client";

import { useState } from "react";

import { AreYouSureDialog } from "@/components/ui/are-you-sure-dialog";
import ui from "@/content/ui.json";
import { useDeleteMedia } from "@/hooks/use-media";
import { MediaTab, useMediaSearch } from "@/hooks/use-media-search";
import { useMediaSelection } from "@/hooks/use-media-selection";
import { GitHubFile } from "@/lib/github-cms";

import { MediaGrid } from "./media/MediaGrid";
import { MediaToolbar } from "./media/MediaToolbar";
import { MoveMediaDialog } from "./media/MoveMediaDialog";

interface MediaLibraryProps {
  onSelect?: (url: string) => void;
  selectedUrl?: string;
}

export function MediaLibrary({ onSelect, selectedUrl }: MediaLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<MediaTab>("all");
  const [fileToDelete, setFileToDelete] = useState<GitHubFile | null>(null);
  const [fileToMove, setFileToMove] = useState<
    (GitHubFile & { isOrphaned?: boolean }) | null
  >(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const {
    groupedImages,
    loading,
    availableTabs,
    filteredCount,
    totalCount,
    images,
  } = useMediaSearch({ searchQuery, activeTab });

  const {
    isSelectMode,
    selectedForAction,
    toggleSelect,
    toggleSelectMode,
    selectAll,
    clearSelection,
  } = useMediaSelection({ images });

  const { mutate: deleteMedia, isPending: isDeleting } = useDeleteMedia();

  const handleDeleteClick = (file: GitHubFile) => {
    setFileToDelete(file);
  };

  const handleMoveClick = (file: GitHubFile & { isOrphaned?: boolean }) => {
    setFileToMove(file);
  };

  // Extract current folder from file path
  const getCurrentFolder = (path: string) => {
    const parts = path.replace("public/uploads/", "").split("/");

    return parts.length > 1 ? parts[0] : "default";
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

  const handleBulkDelete = async () => {
    if (
      !confirm(
        ui.mediaLibrary.bulkDeleteConfirm.replace(
          "{count}",
          selectedForAction.size.toString(),
        ),
      )
    )
      return;

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
      </div>

      <AreYouSureDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title={ui.mediaLibrary.deleteDialogTitle}
        description={
          <span
            dangerouslySetInnerHTML={{
              __html: ui.mediaLibrary.deleteDialogDescription.replace(
                "{name}",
                fileToDelete?.name || "",
              ),
            }}
          />
        }
        onConfirm={confirmDelete}
        confirmText={ui.common.delete}
        isLoading={isDeleting}
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
