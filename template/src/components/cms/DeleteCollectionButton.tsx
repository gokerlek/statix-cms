"use client";

import { Trash2 } from "lucide-react";

import { AreYouSureDialog } from "@/components/ui/are-you-sure-dialog";
import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";
import { useDeleteCollectionItem } from "@/hooks/use-collections";
import { useUnsavedStore } from "@/stores/useUnsavedStore";

interface DeleteButtonProps {
  collectionSlug: string;
  id: string;
}

export function DeleteCollectionButton({
  collectionSlug,
  id,
}: DeleteButtonProps) {
  const { mutate: deleteItem, isPending: isDeleting } =
    useDeleteCollectionItem(collectionSlug);
  const removeChange = useUnsavedStore((state) => state.removeChange);

  const handleDelete = () => {
    deleteItem({ id });
    // Also remove from unsaved changes store
    removeChange(collectionSlug, id);

    // Clear localStorage for this item
    const localKey = `unsaved-content-${collectionSlug}-${id}`;

    localStorage.removeItem(localKey);
  };

  return (
    <AreYouSureDialog
      trigger={
        <Button
          variant="destructive"
          size="icon"
          disabled={isDeleting}
          aria-label={ui.common.delete}
        >
          <Trash2 className="size-4" />
        </Button>
      }
      title={ui.common.areYouSure}
      description={ui.common.deleteConfirmation}
      onConfirm={handleDelete}
      confirmText={ui.common.delete}
      isLoading={isDeleting}
    />
  );
}
