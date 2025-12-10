"use client";

import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";
import { MediaTab } from "@/hooks/use-media-search";

import { CMSSearch } from "../shared/CMSSearch";

interface MediaToolbarProps {
  activeTab: MediaTab;
  onTabChange: (val: MediaTab) => void;
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
}: MediaToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Filter Cloud */}
      <div className="flex flex-wrap gap-2">
        {availableTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "outline"}
            size="sm"
            onClick={() => onTabChange(tab.id as MediaTab)}
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
              Showing {filteredCount} of {totalCount} images
            </span>
          ) : (
            <span>Total {totalImagesCount} images</span>
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
            placeholder={ui.mediaLibrary.searchPlaceholder}
            className="w-[200px] lg:w-[300px]"
          />
        </div>
      </div>
    </div>
  );
}
