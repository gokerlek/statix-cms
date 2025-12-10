"use client";

import React, { useState } from "react";

import {
  AlertTriangle,
  CheckCircle,
  FileText,
  FolderOpen,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ui from "@/content/ui.json";
import { useMoveMedia } from "@/hooks/use-media-move";
import { useMediaReferences } from "@/hooks/use-media-references";
import { statixConfig } from "@/statix.config";

interface MoveMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: {
    path: string;
    name: string;
    isOrphaned?: boolean;
  };
  currentFolder: string;
}

export function MoveMediaDialog({
  open,
  onOpenChange,
  media,
  currentFolder,
}: MoveMediaDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState(currentFolder);
  const { mutate: moveMedia, isPending } = useMoveMedia();
  const { data: references, isLoading: loadingRefs } = useMediaReferences(
    open ? media.name : null,
  );

  const folders = [
    { value: "default", label: ui.uploadSection.defaultFolder },
    ...statixConfig.collections.map((col) => ({
      value: col.slug,
      label: col.label,
    })),
  ];

  const handleMove = () => {
    if (selectedFolder === currentFolder) return;

    moveMedia(
      {
        currentPath: media.path,
        newFolder: selectedFolder,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  const isSameFolder = selectedFolder === currentFolder;
  const hasReferences = references && references.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {ui.mediaMove.dialogTitle}
          </DialogTitle>

          <DialogDescription>
            {ui.mediaMove.dialogDescription}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{ui.mediaMove.moving}</span>
            </div>

            <Progress value={50} className="h-2" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>{ui.mediaMove.copyingImage}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{ui.mediaMove.updatingReferences}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {ui.mediaMove.currentLocation}
              </label>

              <div className="rounded-md bg-muted p-2 text-sm text-muted-foreground">
                {media.path.replace("public", "")}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {ui.mediaMove.newFolder}
              </label>

              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder={ui.mediaMove.selectFolder} />
                </SelectTrigger>

                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem
                      key={folder.value}
                      value={folder.value}
                      disabled={folder.value === currentFolder}
                    >
                      {folder.label}
                      {folder.value === currentFolder &&
                        ` ${ui.mediaMove.currentSuffix}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* References Section */}
            {loadingRefs ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : hasReferences ? (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900/50 dark:bg-yellow-900/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />

                  <div className="flex-1">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      {ui.mediaMove.usedInContent.replace(
                        "{count}",
                        String(references.length),
                      )}
                    </p>

                    <ul className="mt-2 space-y-1">
                      {references.slice(0, 5).map((ref) => (
                        <li
                          key={ref.path}
                          className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="truncate">{ref.title}</span>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            ({ref.collection})
                          </span>
                        </li>
                      ))}

                      {references.length > 5 && (
                        <li className="text-xs text-yellow-600 dark:text-yellow-400">
                          {ui.mediaMove.moreItems.replace(
                            "{count}",
                            String(references.length - 5),
                          )}
                        </li>
                      )}
                    </ul>

                    <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      {ui.mediaMove.referencesWillUpdate}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            type="button"
          >
            {ui.common.cancel}
          </Button>

          <Button
            onClick={handleMove}
            disabled={isPending || isSameFolder}
            type="button"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {ui.mediaMove.move}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
