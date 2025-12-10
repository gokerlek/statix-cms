"use client";

import { ReactNode } from "react";

import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";

interface FieldPreviewProps {
  /** The file path */
  path: string;
  /** Preview content (image thumbnail or file icon) */
  preview: ReactNode;
  /** Edit button/trigger element */
  editTrigger: ReactNode;
  /** Called when delete is clicked */
  onDelete: () => void;
  /** Show loading state for delete */
  isDeleting?: boolean;
  /** Additional info to display (e.g., file size) */
  additionalInfo?: ReactNode;
}

/**
 * Shared component for displaying file/image preview with info and actions
 * Used by ImageField and FileField
 */
export function FieldPreview({
  path,
  preview,
  editTrigger,
  onDelete,
  isDeleting,
  additionalInfo,
}: FieldPreviewProps) {
  // Extract filename from path (remove timestamp prefix if present)
  const rawFileName = path.split("/").pop() || "";
  const displayName = rawFileName.replace(/^\d+-/, "");
  const folderPath = path.split("/").slice(0, -1).join("/");

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Preview (image thumbnail or file icon) */}
      <div className="relative size-24 bg-muted shrink-0 rounded-lg overflow-hidden flex items-center justify-center">
        {preview}
      </div>

      {/* File Info & Actions */}
      <div className="flex flex-col gap-3 min-w-0 flex-1">
        <div className="space-y-1">
          <p className="text-sm font-medium truncate">{displayName}</p>

          <p className="text-xs text-muted-foreground truncate">{folderPath}</p>

          {additionalInfo}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {editTrigger}

          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={ui.common.delete}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
