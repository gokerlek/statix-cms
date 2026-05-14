"use client";

import { Button } from "@/statix/components/ui/button";
import ui from "@/statix/content/ui.json";

import { CMSSearch } from "../shared/CMSSearch";

export type LibraryTarget = "media" | "files";

interface MediaToolbarProps {
  activeTab: string;
  onTabChange: (val: string) => void;
  availableTabs: { id: string; label: string; count: number }[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  selectedCount: number;
  totalCount: number;
  filteredCount: number;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  isBulkDeleting: boolean;
  totalImagesCount: number;
  /**
   * Library bucket — drives the "Showing N of M images/files" copy and
   * the search placeholder. Defaults to `"media"` so existing
   * `MediaClientPage` callers keep working without prop changes.
   */
  target?: LibraryTarget;
}

export function MediaToolbar({
  activeTab,
  onTabChange,
  availableTabs,
  searchQuery,
  onSearchChange,
  isSelectMode,
  onToggleSelectMode,
  selectedCount,
  onSelectAll,
  onDeleteSelected,
  isBulkDeleting,
  totalImagesCount,
  filteredCount,
  totalCount,
  target = "media",
}: MediaToolbarProps) {
  const isFiles = target === "files";
  const showingTpl = isFiles ? ui.filesPage.showing : ui.mediaLibrary.showing;
  const totalTpl = isFiles ? ui.filesPage.total : ui.mediaLibrary.total;
  const searchPlaceholder = isFiles
    ? ui.filesPage.searchPlaceholder
    : ui.mediaLibrary.searchPlaceholder;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Cloud */}
      <div className="flex flex-wrap gap-2">
        {availableTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "outline"}
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className="rounded-full h-8"
          >
            {tab.label}

            <span className="ml-2 opacity-50 text-xs">{tab.count}</span>
          </Button>
        ))}
      </div>

      {/* Actions Row */}
      <div className="flex justify-between items-center gap-4 border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {!!searchQuery || activeTab !== "all" ? (
            <span>
              {showingTpl
                .replace("{filtered}", filteredCount.toString())
                .replace("{total}", totalCount.toString())}
            </span>
          ) : (
            <span>
              {totalTpl.replace("{count}", totalImagesCount.toString())}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                {selectedCount === totalImagesCount
                  ? ui.mediaLibrary.deselectAll
                  : ui.mediaLibrary.selectAll}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteSelected}
                disabled={selectedCount === 0 || isBulkDeleting}
              >
                {isBulkDeleting
                  ? ui.mediaLibrary.deleting
                  : ui.mediaLibrary.deleteSelected.replace(
                      "{count}",
                      selectedCount.toString(),
                    )}
              </Button>

              <Button variant="ghost" size="sm" onClick={onToggleSelectMode}>
                {ui.mediaLibrary.cancel}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onToggleSelectMode}>
              {ui.mediaLibrary.select}
            </Button>
          )}

          {/* Search Bar */}
          <CMSSearch
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-[200px] lg:w-[300px]"
          />
        </div>
      </div>
    </div>
  );
}
