"use client";

import { IconTrash } from "@tabler/icons-react";

import { AreYouSureDialog } from "@/statix/components/ui/are-you-sure-dialog";
import { buttonVariants } from "@/statix/components/ui/button";
import ui from "@/statix/content/ui.json";
import { cn } from "@/statix/lib/utils";
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

  // `AreYouSureDialog` wraps its `trigger` in an `AlertDialogTrigger`, which
  // already renders a `<button>`. Putting another `<Button>` inside nests
  // buttons and fails hydration. We pass just the *visual* content + the
  // button variant classes on a `<span>`, and let the dialog trigger own the
  // real `<button>` element.
  const triggerClassName = cn(
    buttonVariants({ variant: "destructive", size: "icon" }),
    isDeleting && "pointer-events-none opacity-50",
  );

  return (
    <AreYouSureDialog
      trigger={
        <span
          className={triggerClassName}
          aria-label={ui.common.delete}
          aria-disabled={isDeleting || undefined}
        >
          <IconTrash className="size-4" />
        </span>
      }
      title={ui.common.areYouSure}
      description={ui.common.deleteConfirmation}
      onConfirm={handleDelete}
      confirmText={ui.common.delete}
      isLoading={isDeleting}
    />
  );
}
