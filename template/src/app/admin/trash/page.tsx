"use client";

import { useState } from "react";

import { TrashList } from "@/components/cms/TrashList";
import { TrashToolbar } from "@/components/cms/TrashToolbar";
import { PageLoading } from "@/components/ui/loading";
import { useTranslation } from "@/hooks/use-translation";
import { TrashItem, useDeleteTrash, useRestoreTrash, useTrash } from "@/hooks/use-trash";

export default function TrashPage() {
  const { t } = useTranslation();
  const { data: items, isLoading } = useTrash();
  const restoreMutation = useRestoreTrash();
  const deleteMutation = useDeleteTrash();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const selectedItems = (): TrashItem[] =>
    (items ?? []).filter((item) => selectedPaths.includes(item.path));

  const handleToggleSelect = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && items) {
      setSelectedPaths(items.map((item) => item.path));
    } else {
      setSelectedPaths([]);
    }
  };

  const handleRestore = () => {
    restoreMutation.mutate(selectedItems(), {
      onSuccess: () => setSelectedPaths([]),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedItems(), {
      onSuccess: () => setSelectedPaths([]),
    });
  };

  const handleEmptyTrash = () => {
    if (items) {
      deleteMutation.mutate(items, {
        onSuccess: () => setSelectedPaths([]),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <PageLoading />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("trash.title")}
        </h1>

        <p className="text-muted-foreground">{t("trash.description")}</p>
      </div>

      <TrashToolbar
        selectedCount={selectedPaths.length}
        onRestore={handleRestore}
        onDelete={handleDelete}
        onEmptyTrash={handleEmptyTrash}
        isRestoring={restoreMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <TrashList
        items={items || []}
        selectedItems={selectedPaths}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
