import { RotateCcw, Trash2, X } from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface TrashToolbarProps {
  selectedCount: number;
  onRestore: () => void;
  onDelete: () => void;
  onEmptyTrash: () => void;
  isRestoring: boolean;
  isDeleting: boolean;
}

export function TrashToolbar({
  selectedCount,
  onRestore,
  onDelete,
  onEmptyTrash,
  isRestoring,
  isDeleting,
}: TrashToolbarProps) {
  const { t } = useTranslation();

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
              <RotateCcw className="mr-2 h-4 w-4" />

              {t("trash.restoreSelected")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isRestoring || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />

                  {t("trash.deleteSelected")}
                </Button>
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
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <X className="mr-2 h-4 w-4" />

                {t("trash.emptyTrash")}
              </Button>
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
