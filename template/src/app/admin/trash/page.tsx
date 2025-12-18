"use client";

import { useState } from "react";

import { TrashList } from "@/components/cms/TrashList";
import { TrashToolbar } from "@/components/cms/TrashToolbar";
import { PageLoading } from "@/components/ui/loading";
import { useTranslation } from "@/hooks/use-translation";
import { useDeleteTrash, useRestoreTrash, useTrash } from "@/hooks/use-trash";

export default function TrashPage() {
  const { t } = useTranslation();
  const { data: items, isLoading } = useTrash();
  const restoreMutation = useRestoreTrash();
  const deleteMutation = useDeleteTrash();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleToggleSelect = (path: string) => {
    setSelectedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && items) {
      setSelectedItems(items.map((item) => item.path));
    } else {
      setSelectedItems([]);
    }
  };

  const handleRestore = () => {
    restoreMutation.mutate(selectedItems, {
      onSuccess: () => setSelectedItems([]),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedItems, {
      onSuccess: () => setSelectedItems([]),
    });
  };

  const handleEmptyTrash = () => {
    if (items) {
      const allPaths = items.map((item) => item.path);

      deleteMutation.mutate(allPaths, {
        onSuccess: () => setSelectedItems([]),
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
        selectedCount={selectedItems.length}
        onRestore={handleRestore}
        onDelete={handleDelete}
        onEmptyTrash={handleEmptyTrash}
        isRestoring={restoreMutation.isPending}
        isDeleting={deleteMutation.isPending}
      />

      <TrashList
        items={items || []}
        selectedItems={selectedItems}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
      />
    </div>
  );
}
