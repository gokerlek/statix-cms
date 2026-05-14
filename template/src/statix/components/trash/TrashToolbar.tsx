import { IconRestore, IconTrash, IconX } from "@tabler/icons-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/statix/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/statix/components/ui/button";
import { useTranslation } from "@/statix/hooks/use-translation";
import { cn } from "@/statix/lib/utils";

interface TrashToolbarProps {
  selectedCount: number;
  totalCount: number;
  onRestore: () => void;
  onDelete: () => void;
  onEmptyTrash: () => void;
  isRestoring: boolean;
  isDeleting: boolean;
}

export function TrashToolbar({
  selectedCount,
  totalCount,
  onRestore,
  onDelete,
  onEmptyTrash,
  isRestoring,
  isDeleting,
}: TrashToolbarProps) {
  const { t } = useTranslation();

  // Don't show toolbar when trash is empty
  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between mb-4 p-2 bg-muted/30 rounded-lg border">
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <span className="text-sm font-medium px-2">
            {t("trash.itemsSelected", { count: selectedCount })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {selectedCount > 0 ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onRestore}
              disabled={isRestoring || isDeleting}
            >
              <IconRestore className="mr-2 h-4 w-4" />

              {t("trash.restoreSelected")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger
                className={cn(
                  buttonVariants({ variant: "destructive", size: "sm" }),
                )}
                disabled={isRestoring || isDeleting}
              >
                <IconTrash className="mr-2 h-4 w-4" />

                {t("trash.deleteSelected")}
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>

                  <AlertDialogDescription>
                    {t("trash.confirmDelete")}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>

                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("common.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-destructive hover:text-destructive",
              )}
            >
              <IconX className="mr-2 h-4 w-4" />

              {t("trash.emptyTrash")}
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("common.areYouSure")}</AlertDialogTitle>

                <AlertDialogDescription>
                  {t("trash.confirmEmpty")}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>

                <AlertDialogAction
                  onClick={onEmptyTrash}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t("trash.emptyTrash")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
