"use client";

import React, { useState } from "react";

import {
  AlertTriangle,
  CheckCircle,
  ImagePlus,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FilePreview } from "@/components/ui/file-preview";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import ui from "@/content/ui.json";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useMultiFileUpload } from "@/hooks/use-multi-file-upload";
import { cn } from "@/lib/utils";
import { statixConfig } from "@/statix.config";

interface UploadSectionProps {
  onSuccess?: (url: string) => void;
  compact?: boolean;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onSuccess,
  compact = false,
}) => {
  const [folder, setFolder] = useState("default");

  // Single file upload for compact mode
  const singleUpload = useFileUpload();

  // Multi file upload for full mode
  const multiUpload = useMultiFileUpload();

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

  // Compact mode - for dialogs/modals (single file only)
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
          <Upload className="w-4 h-4 mr-2" />
          {singleUpload.uploading
            ? ui.uploadSection.uploadingButton
            : ui.uploadSection.uploadButton}
        </Button>
      </div>
    );
  }

  // Full mode - for media page (multiple files)
  const hasFiles = multiUpload.files.length > 0;
  const pendingCount = multiUpload.files.filter(
    (f) => f.status === "pending",
  ).length;

  return (
    <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ImagePlus className="w-4 h-4" />
          {ui.uploadSection.title}

          {hasFiles && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {multiUpload.files.length} dosya
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
              Temizle
            </Button>
          )}

          <Button
            onClick={handleMultiUpload}
            disabled={pendingCount === 0 || multiUpload.uploading}
            size="sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            {multiUpload.uploading
              ? `Yükleniyor (${multiUpload.progress.completed}/${multiUpload.progress.total})`
              : `${pendingCount > 0 ? `${pendingCount} Dosya ` : ""}Yükle`}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Dropzone - Always visible at top */}
        {!hasFiles && (
          <UploadDropzone
            onFileSelect={multiUpload.handleFilesChange}
            size="md"
            multiple
          />
        )}

        {/* File List */}
        {hasFiles && (
          <div className="space-y-3">
            {/* Add more files button */}
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={multiUpload.handleFilesChange}
                />

                <span className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <ImagePlus className="w-4 h-4" />
                  Daha fazla görsel ekle
                </span>
              </label>
            </div>

            {/* Files */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {multiUpload.files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-background",
                    fileItem.status === "done" &&
                      "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
                    fileItem.status === "error" &&
                      "border-destructive/50 bg-destructive/5",
                    fileItem.status === "duplicate" &&
                      "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20 opacity-60",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileItem.preview}
                    alt={fileItem.filename}
                    className="w-12 h-12 object-cover rounded-md shrink-0"
                  />

                  {/* Info & Controls */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      {/* Filename */}
                      {fileItem.status === "pending" ? (
                        <Input
                          value={fileItem.filename}
                          onChange={(e) =>
                            multiUpload.updateFilename(
                              fileItem.id,
                              e.target.value,
                            )
                          }
                          className="h-8 text-sm flex-1"
                          placeholder="Dosya adı"
                        />
                      ) : (
                        <p className="text-sm font-medium truncate flex-1">
                          {fileItem.filename}
                        </p>
                      )}

                      {/* Collection Selector */}
                      {fileItem.status === "pending" && (
                        <Select
                          value={fileItem.folder}
                          onValueChange={(value) =>
                            multiUpload.updateFolder(fileItem.id, value)
                          }
                        >
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

                      {/* Status or Remove */}
                      {fileItem.status === "uploading" && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                      )}

                      {fileItem.status === "done" && (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      )}

                      {fileItem.status === "error" && (
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}

                      {fileItem.status === "duplicate" && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                      )}

                      {fileItem.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => multiUpload.removeFile(fileItem.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Error message */}
                    {fileItem.error && (
                      <p className="text-xs text-destructive">
                        {fileItem.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress */}
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
                  {multiUpload.progress.completed} /{" "}
                  {multiUpload.progress.total} yükleniyor...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
