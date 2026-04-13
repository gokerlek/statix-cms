"use client";

import { IconTrash } from "@tabler/icons-react";

import { AreYouSureDialog } from "@/statix/components/ui/are-you-sure-dialog";
import { Button } from "@/statix/components/ui/button";
import ui from "@/statix/content/ui.json";
import { useDeleteCollectionItem } from "@/statix/hooks/use-collections";
import { useUnsavedStore } from "@/statix/stores/useUnsavedStore";

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
          <IconTrash className="size-4" />
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
