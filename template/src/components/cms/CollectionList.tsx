"use client";

import Link from "next/link";

import { Edit, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import ui from "@/content/ui.json";
import { useCollectionSearch } from "@/hooks/use-collection-search";
import { useCollectionItems } from "@/hooks/use-collections";
import { ROUTES } from "@/lib/constants";
import { GitHubFile } from "@/lib/github-cms";
import { cn } from "@/lib/utils";
import { useUnsavedStore } from "@/stores/useUnsavedStore";

import { DeleteCollectionButton } from "./DeleteCollectionButton";
import { CMSSearch } from "./shared/CMSSearch";
import { CMSTabs } from "./shared/CMSTabs";
import { StatusBadge } from "./StatusBadge";

interface CollectionListProps {
  initialData: GitHubFile[];
  collectionSlug: string;
  collectionLabel: string;
}

export function CollectionList({
  initialData,
  collectionSlug,
  collectionLabel,
}: CollectionListProps) {
  const { data: files = [] } = useCollectionItems(collectionSlug, initialData);
  const hasChange = useUnsavedStore((state) => state.hasChange);
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredFiles,
  } = useCollectionSearch(files);

  if (files.length === 0 && searchQuery === "" && statusFilter === "all") {
    return (
      <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed border-border">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>

          <h3 className="mb-2">{ui.collectionList.noEntriesTitle}</h3>

          <p className="text-muted-foreground mb-6">
            {ui.collectionList.noEntriesDescription.replace(
              "{label}",
              collectionLabel.toLowerCase(),
            )}
          </p>

          <Link
            href={ROUTES.ADMIN.COLLECTION_NEW(collectionSlug)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />

            {ui.collectionList.createFirstEntry}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <CMSTabs
          defaultValue="all"
          value={statusFilter}
          onValueChange={setStatusFilter}
          className="w-full sm:w-auto"
          tabs={[
            { value: "all", label: ui.status.all },
            { value: "published", label: ui.status.published },
            { value: "draft", label: ui.status.draft },
            { value: "archived", label: ui.status.archived },
          ]}
        />

        <div className="w-full sm:w-64">
          <CMSSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={ui.collectionList.searchPlaceholder}
          />
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground w-full">
                {ui.collectionList.tableHeaders.name}
              </th>

              <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">
                {ui.collectionList.tableHeaders.status}
              </th>

              <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">
                {ui.collectionList.tableHeaders.actions}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {filteredFiles.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  {ui.collectionList.noEntriesTitle}
                </td>
              </tr>
            ) : (
              filteredFiles.map((file) => {
                const id = file.name.replace(".json", "");
                const hasLocalChange = hasChange(collectionSlug, id);

                return (
                  <tr
                    key={file.sha}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm flex items-center gap-2">
                        {file.title}

                        {hasLocalChange && (
                          <Badge
                            variant="outline"
                            className="text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 text-[10px] h-5 px-1.5"
                          >
                            Unsaved (Local)
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={file.status || "published"} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={ROUTES.ADMIN.COLLECTION_ITEM(
                            collectionSlug,
                            id,
                          )}
                          className={cn(
                            buttonVariants({
                              variant: "secondary",
                              size: "icon",
                            }),
                          )}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <DeleteCollectionButton
                          collectionSlug={collectionSlug}
                          id={id}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
