"use client";

import React, { useState } from "react";

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconFilePlus,
  IconLoader2,
  IconPhotoPlus,
  IconUpload,
  IconX,
} from "@tabler/icons-react";

import { statixConfig } from "@/statix.config";
import { Button } from "@/statix/components/ui/button";
import { FilePreview } from "@/statix/components/ui/file-preview";
import { Input } from "@/statix/components/ui/input";
import { Progress } from "@/statix/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/statix/components/ui/select";
import { UploadDropzone } from "@/statix/components/ui/upload-dropzone";
import ui from "@/statix/content/ui.json";
import {
  type UploadTarget,
  useFileUpload,
} from "@/statix/hooks/use-file-upload";
import { useMultiFileUpload } from "@/statix/hooks/use-multi-file-upload";
import {
  getExtension,
  getExtensionColor,
  getTypeIcon,
} from "@/statix/lib/file-icons";
import {
  getAcceptString,
  getMaxUploadSize,
} from "@/statix/lib/file-validation";
import { cn, formatFileSize } from "@/statix/lib/utils";

interface UploadSectionProps {
  onSuccess?: (url: string) => void;
  compact?: boolean;
  /**
   * Which bucket to write into. `"media"` (default) posts image uploads
   * to `/api/upload`, keeps folder selector + `accept="image/*"`.
   * `"files"` posts document uploads to `/api/file`, hides the folder
   * selector (files bucket is flat), and accepts any MIME type.
   */
  target?: UploadTarget;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onSuccess,
  compact = false,
  target = "media",
}) => {
  const [folder, setFolder] = useState("default");

  const singleUpload = useFileUpload({ target });
  const multiUpload = useMultiFileUpload({ target });

  const isFiles = target === "files";
  // Tighten `accept` to the exact MIME list the server allows — the OS
  // file picker pre-filters to those types, so users can't even pick
  // an `.exe` and hit a confusing backend rejection later.
  const accept = getAcceptString(isFiles ? "file" : "image");
  const dropzoneHint = (
    isFiles ? ui.uploadSection.hintFiles : ui.uploadSection.hintMedia
  ).replace("{maxSize}", formatFileSize(getMaxUploadSize()));
  const headerTitle = isFiles
    ? ui.uploadSection.titleFiles
    : ui.uploadSection.title;
  const uploadCtaLabel = isFiles
    ? ui.uploadSection.uploadButtonFiles
    : ui.uploadSection.uploadButton;
  const HeaderIcon = isFiles ? IconFilePlus : IconPhotoPlus;

  const handleSingleUpload = async () => {
    await singleUpload.handleUpload({
      folder: folder !== "default" ? folder : undefined,
      filename: singleUpload.filename,
      onSuccess,
    });
  };

  const handleMultiUpload = async () => {
    await multiUpload.handleUploadAll({
      onSuccess: (urls) => {
        urls.forEach((url) => onSuccess?.(url));
      },
    });
  };

  // ── Compact mode ─ used inside dialogs/drawers (single file) ──
  if (compact) {
    return (
      <div className="space-y-4">
        {singleUpload.preview ? (
          <FilePreview
            src={singleUpload.preview}
            alt="Upload preview"
            onClear={singleUpload.clearFile}
            aspectRatio="video"
            size="lg"
          />
        ) : (
          <UploadDropzone
            onFileSelect={singleUpload.handleFileChange}
            size="md"
            accept={accept}
            hint={dropzoneHint}
          />
        )}

        <div className="flex gap-2">
          <Input
            value={singleUpload.filename}
            onChange={(e) => singleUpload.setFilename(e.target.value)}
            placeholder={ui.uploadSection.fileNamePlaceholder}
            disabled={!singleUpload.file}
            className="flex-1"
          />

          <Select value={folder} onValueChange={setFolder}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="default">
                {ui.uploadSection.defaultFolder}
              </SelectItem>

              {statixConfig.collections.map((col) => (
                <SelectItem key={col.slug} value={col.slug}>
                  {col.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSingleUpload}
          disabled={!singleUpload.file || singleUpload.uploading}
          className="w-full"
        >
          <IconUpload className="w-4 h-4 mr-2" />
          {singleUpload.uploading
            ? ui.uploadSection.uploadingButton
            : uploadCtaLabel}
        </Button>
      </div>
    );
  }

  // ── Full mode — multi-file queue + per-file controls ──
  const hasFiles = multiUpload.files.length > 0;
  const pendingCount = multiUpload.files.filter(
    (f) => f.status === "pending",
  ).length;

  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <HeaderIcon className="w-4 h-4" />
          {headerTitle}

          {hasFiles && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {ui.uploadSection.fileCount.replace(
                "{count}",
                multiUpload.files.length.toString(),
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasFiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={multiUpload.clearAll}
              className="text-muted-foreground hover:text-destructive h-8"
            >
              {ui.uploadSection.clear}
            </Button>
          )}

          <Button
            onClick={handleMultiUpload}
            disabled={pendingCount === 0 || multiUpload.uploading}
            size="sm"
          >
            <IconUpload className="w-4 h-4 mr-2" />
            {multiUpload.uploading
              ? ui.uploadSection.uploadingProgress
                  .replace(
                    "{completed}",
                    multiUpload.progress.completed.toString(),
                  )
                  .replace("{total}", multiUpload.progress.total.toString())
              : pendingCount > 0
                ? ui.uploadSection.uploadPending.replace(
                    "{count}",
                    pendingCount.toString(),
                  )
                : uploadCtaLabel}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!hasFiles && (
          <UploadDropzone
            onFileSelect={multiUpload.handleFilesChange}
            size="md"
            multiple
            accept={accept}
            hint={dropzoneHint}
          />
        )}

        {hasFiles && (
          <div className="space-y-3">
            {/* Add more files button */}
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept={accept}
                  className="hidden"
                  onChange={multiUpload.handleFilesChange}
                />

                <span className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <HeaderIcon className="w-4 h-4" />
                  {ui.uploadSection.addMore}
                </span>
              </label>
            </div>

            {/* File list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {multiUpload.files.map((fileItem) => (
                <QueuedFileRow
                  key={fileItem.id}
                  fileItem={fileItem}
                  onRename={(val) =>
                    multiUpload.updateFilename(fileItem.id, val)
                  }
                  onFolderChange={(val) =>
                    multiUpload.updateFolder(fileItem.id, val)
                  }
                  onRemove={() => multiUpload.removeFile(fileItem.id)}
                />
              ))}
            </div>

            {multiUpload.uploading && (
              <div className="space-y-1 pt-2">
                <Progress
                  value={
                    (multiUpload.progress.completed /
                      multiUpload.progress.total) *
                    100
                  }
                />

                <p className="text-xs text-muted-foreground text-center">
                  {ui.uploadSection.progressLabel
                    .replace(
                      "{completed}",
                      multiUpload.progress.completed.toString(),
                    )
                    .replace("{total}", multiUpload.progress.total.toString())}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Per-row renderer ────────────────────────────────────────────────────

interface QueuedFileItem {
  id: string;
  file: File;
  preview: string;
  filename: string;
  folder: string;
  status: "pending" | "uploading" | "done" | "error" | "duplicate";
  url?: string;
  error?: string;
}

function QueuedFileRow({
  fileItem,
  onRename,
  onFolderChange,
  onRemove,
}: {
  fileItem: QueuedFileItem;
  onRename: (val: string) => void;
  onFolderChange: (val: string) => void;
  onRemove: () => void;
}) {
  const ext = getExtension(fileItem.file.name);
  const isImage = fileItem.file.type.startsWith("image/");

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-background",
        fileItem.status === "done" &&
          "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
        fileItem.status === "error" && "border-destructive/50 bg-destructive/5",
        fileItem.status === "duplicate" &&
          "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 opacity-60",
      )}
    >
      {/* Preview or icon */}
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={fileItem.preview}
          alt={fileItem.filename}
          className="w-12 h-12 object-cover rounded-md shrink-0"
        />
      ) : (
        <FileIconTile ext={ext} />
      )}

      {/* Info & Controls */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          {fileItem.status === "pending" ? (
            <Input
              value={fileItem.filename}
              onChange={(e) => onRename(e.target.value)}
              className="h-8 text-sm flex-1"
              placeholder={ui.uploadSection.filenamePlaceholder}
            />
          ) : (
            <p className="text-sm font-medium truncate flex-1">
              {fileItem.filename}
            </p>
          )}

          {fileItem.status === "pending" && (
            <Select value={fileItem.folder} onValueChange={onFolderChange}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="default">
                  {ui.uploadSection.defaultFolder}
                </SelectItem>

                {statixConfig.collections.map((col) => (
                  <SelectItem key={col.slug} value={col.slug}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {fileItem.status === "uploading" && (
            <IconLoader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          )}

          {fileItem.status === "done" && (
            <IconCircleCheck className="w-4 h-4 text-green-500 shrink-0" />
          )}

          {fileItem.status === "error" && (
            <IconCircleX className="w-4 h-4 text-destructive shrink-0" />
          )}

          {fileItem.status === "duplicate" && (
            <IconAlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
          )}

          {fileItem.status === "pending" && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onRemove}
            >
              <IconX className="w-4 h-4" />
            </Button>
          )}
        </div>

        {fileItem.error && (
          <p className="text-xs text-destructive">{fileItem.error}</p>
        )}
      </div>
    </div>
  );
}

// Module-scope helper. Uses `React.createElement` so the icon component
// is referenced by value rather than captured as a const + JSX'd —
// avoids the `react-hooks/static-components` lint rule that flags
// dynamic component creation inside a render body.
function FileIconTile({ ext }: { ext: string }) {
  return (
    <div className="w-12 h-12 flex items-center justify-center rounded-md bg-secondary/50 shrink-0">
      {React.createElement(getTypeIcon(ext), {
        className: cn("w-6 h-6", getExtensionColor(ext)),
      })}
    </div>
  );
}
