import { useCallback, useState } from "react";

import { toast } from "sonner";

import ui from "@/statix/content/ui.json";
import { isMimeAllowed } from "@/statix/lib/file-validation";

import { useUploadFile } from "./use-files";
import { useUploadMedia } from "./use-media";

export type UploadTarget = "media" | "files";

export interface UploadOptions {
  folder?: string;
  filename?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export interface FileUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  filename: string;
}

export interface FileUploadActions {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: (options?: UploadOptions) => Promise<void>;
  clearFile: () => void;
  setFilename: (name: string) => void;
}

interface UseFileUploadOptions {
  /**
   * Which R2 bucket prefix + API endpoint to target. Defaults to
   * `"media"` so existing callers (MediaClientPage, MediaDrawer,
   * compact image pickers) keep working unchanged.
   */
  target?: UploadTarget;
}

/**
 * Single-file upload hook shared by Media + Files flows. Internally
 * branches on `target` to pick the right mutation (`/api/upload` for
 * media, `/api/file` for files). UI state (preview, filename editor,
 * loading flag) is identical in both modes so `UploadSection` can be
 * one component with a prop.
 */
export function useFileUpload(
  options: UseFileUploadOptions = {},
): FileUploadState & FileUploadActions {
  const { target = "media" } = options;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState("");

  const mediaMutation = useUploadMedia();
  const filesMutation = useUploadFile();

  const uploading =
    target === "files" ? filesMutation.isPending : mediaMutation.isPending;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      if (!selectedFile) return;

      // Drag-drop bypasses the native `<input accept>` filter, so an
      // unsupported MIME would silently fall through to the API and
      // 400. Reject early with a clear toast.
      const kind = target === "files" ? "file" : "image";

      if (!isMimeAllowed(selectedFile, kind)) {
        toast.warning(
          ui.uploadSection.unsupportedType.replace("{name}", selectedFile.name),
        );

        return;
      }

      setFile(selectedFile);
      setFilename(stripExtension(selectedFile.name));
      const objectUrl = URL.createObjectURL(selectedFile);

      setPreview(objectUrl);
    },
    [target],
  );

  const clearFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);

    setFile(null);
    setPreview(null);
    setFilename("");
  }, [preview]);

  const handleUpload = useCallback(
    async (uploadOptions: UploadOptions = {}) => {
      if (!file) return;

      try {
        const uploadFilename = uploadOptions.filename || filename;
        let data: { url: string };

        const folderArg =
          uploadOptions.folder && uploadOptions.folder !== "default"
            ? uploadOptions.folder
            : undefined;

        if (target === "files") {
          data = await filesMutation.mutateAsync({
            file,
            folder: folderArg,
            filename: uploadFilename,
          });
        } else {
          data = await mediaMutation.mutateAsync({
            file,
            folder: folderArg,
            filename: uploadFilename,
          });
        }

        clearFile();
        uploadOptions.onSuccess?.(data.url);
      } catch (error) {
        const uploadError =
          error instanceof Error ? error : new Error("Upload failed");

        console.error("Upload error:", uploadError);
        uploadOptions.onError?.(uploadError);
      }
    },
    [file, filename, target, clearFile, filesMutation, mediaMutation],
  );

  const setFilenameState = useCallback((name: string) => {
    setFilename(name);
  }, []);

  return {
    file,
    preview,
    uploading,
    filename,
    handleFileChange,
    handleUpload,
    clearFile,
    setFilename: setFilenameState,
  };
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".");

  return dot > 0 ? name.substring(0, dot) : name;
}
