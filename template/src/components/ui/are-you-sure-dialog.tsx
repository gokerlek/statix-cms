import React from "react";

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
import ui from "@/content/ui.json";

interface AreYouSureDialogProps {
  title?: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  isLoading?: boolean;
  loadingText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  // Secondary action support (for 3-button dialogs)
  secondaryAction?: () => void;
  secondaryText?: string;
  secondaryVariant?: "default" | "destructive";
}

export function AreYouSureDialog({
  title = ui.common.areYouSure,
  description,
  onConfirm,
  confirmText = ui.common.confirm,
  cancelText = ui.common.cancel,
  confirmVariant = "destructive",
  isLoading = false,
  loadingText,
  open,
  onOpenChange,
  trigger,
  children,
  secondaryAction,
  secondaryText,
  secondaryVariant = "destructive",
}: AreYouSureDialogProps) {
  // If open/onOpenChange are provided, use controlled mode
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const dialogContent = (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>

        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>

        {secondaryAction && secondaryText && (
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              secondaryAction();
            }}
            className={
              secondaryVariant === "destructive"
                ? "bg-destructive hover:bg-destructive/90"
                : undefined
            }
            disabled={isLoading}
          >
            {secondaryText}
          </AlertDialogAction>
        )}

        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
          className={
            confirmVariant === "destructive"
              ? "bg-destructive hover:bg-destructive/90"
              : undefined
          }
          disabled={isLoading}
        >
          {isLoading ? loadingText || ui.common.loading : confirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );

  if (isControlled) {
    // Controlled mode - open/onOpenChange managed externally
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}

        {dialogContent}
      </AlertDialog>
    );
  }

  // Uncontrolled mode with trigger
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger || children}</AlertDialogTrigger>

      {dialogContent}
    </AlertDialog>
  );
}
