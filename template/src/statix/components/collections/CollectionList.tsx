"use client";

import Link from "next/link";

import { IconPlus } from "@tabler/icons-react";

import { CollectionTable } from "@/statix/components/collections/CollectionTable";
import { CMSSearch } from "@/statix/components/shared/CMSSearch";
import { CMSTabs } from "@/statix/components/shared/CMSTabs";
import { EmptyState } from "@/statix/components/shared/EmptyState";
import { buttonVariants } from "@/statix/components/ui/button";
import { Card, CardContent } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";
import { useCollectionSearch } from "@/statix/hooks/use-collection-search";
import { useCollectionItems } from "@/statix/hooks/use-collections";
import { ROUTES } from "@/statix/lib/constants";
import { GitHubFile } from "@/statix/lib/github-cms";
import { cn } from "@/statix/lib/utils";

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
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredFiles,
  } = useCollectionSearch(files);

  // ── No items at all (not even a filter applied) — show the onboarding card ──
  if (files.length === 0 && searchQuery === "" && statusFilter === "all") {
    return (
      <EmptyState
        framed
        icon={<IconPlus className="w-8 h-8 text-muted-foreground" />}
        title={ui.collectionList.noEntriesTitle}
        description={ui.collectionList.noEntriesDescription.replace(
          "{label}",
          collectionLabel.toLowerCase(),
        )}
        action={
          <Link
            href={ROUTES.ADMIN.COLLECTION_NEW(collectionSlug)}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "gap-2",
            )}
          >
            <IconPlus className="w-5 h-5" />
            {ui.collectionList.createFirstEntry}
          </Link>
        }
      />
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

      <Card className="gap-0 py-0 overflow-hidden">
        <CardContent className="p-0">
          <CollectionTable
            files={filteredFiles}
            collectionSlug={collectionSlug}
          />
        </CardContent>
      </Card>
    </div>
  );
}
