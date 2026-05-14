import { useCallback, useState } from "react";

import { toast } from "sonner";

import ui from "@/statix/content/ui.json";
import { isMimeAllowed } from "@/statix/lib/file-validation";

import { useFiles, useUploadFile } from "./use-files";
import { useMedia, useUploadMedia } from "./use-media";

export type UploadTarget = "media" | "files";

export interface MultiUploadOptions {
  folder?: string;
  onSuccess?: (urls: string[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (completed: number, total: number) => void;
}

export interface FileItem {
  id: string;
  file: File;
  preview: string;
  filename: string;
  folder: string;
  status: "pending" | "uploading" | "done" | "error" | "duplicate";
  url?: string;
  error?: string;
}

export interface MultiFileUploadState {
  files: FileItem[];
  uploading: boolean;
  progress: { completed: number; total: number };
}

export interface MultiFileUploadActions {
  handleFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadAll: (options?: MultiUploadOptions) => Promise<void>;
  removeFile: (id: string) => void;
  updateFilename: (id: string, filename: string) => void;
  updateFolder: (id: string, folder: string) => void;
  clearAll: () => void;
}

interface UseMultiFileUploadOptions {
  target?: UploadTarget;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
}

function getNameWithoutExtension(name: string): string {
  const lastDotIndex = name.lastIndexOf(".");

  return lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
}

/**
 * Multi-file upload hook shared by Media + Files flows. Handles per-file
 * pending/uploading/done/error/duplicate state machine, duplicate
 * detection against the library the user is targeting, and sequential
 * upload with progress reporting.
 */
export function useMultiFileUpload(
  options: UseMultiFileUploadOptions = {},
): MultiFileUploadState & MultiFileUploadActions {
  const { target = "media" } = options;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  // Pick the right mutation + existing-library query based on target.
  // React's rules of hooks require both hooks to be called unconditionally
  // even when only one is used — OK, both are cheap (suspended queries
  // no-op until subscribed).
  const { mutateAsync: uploadMedia } = useUploadMedia();
  const { mutateAsync: uploadFile } = useUploadFile();
  const { data: mediaData } = useMedia();
  const { data: filesData } = useFiles();

  const existingNames = (() => {
    if (target === "files") {
      return new Set(
        filesData?.pages
          .flatMap((p) => p.items)
          .map((m) => {
            const filename = m.key.split("/").pop() || "";

            return filename.toLowerCase();
          }) || [],
      );
    }

    return new Set(
      mediaData?.pages
        .flatMap((p) => p.items)
        .map((m) => {
          const filename = m.path.split("/").pop() || "";

          return filename.toLowerCase();
        }) || [],
    );
  })();

  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;

      if (!selectedFiles || selectedFiles.length === 0) return;

      const existingQueueNames = new Set(
        files.map((f) => sanitizeFilename(f.file.name)),
      );

      const newFiles: FileItem[] = [];
      const duplicateNames: string[] = [];
      const libraryDuplicateNames: string[] = [];
      const unsupportedNames: string[] = [];

      const kind = target === "files" ? "file" : "image";

      Array.from(selectedFiles).forEach((file) => {
        // Drag-drop bypasses `<input accept>` — guard MIME on the
        // client too so unsupported types never reach the queue.
        if (!isMimeAllowed(file, kind)) {
          unsupportedNames.push(file.name);

          return;
        }

        const sanitizedName = sanitizeFilename(file.name);

        if (existingQueueNames.has(sanitizedName)) {
          duplicateNames.push(file.name);

          return;
        }

        if (existingNames.has(sanitizedName)) {
          libraryDuplicateNames.push(file.name);
          newFiles.push({
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            filename: getNameWithoutExtension(file.name),
            folder: "default",
            status: "duplicate" as const,
            error: ui.uploadSection.duplicateItem,
          });

          return;
        }

        newFiles.push({
          id: generateId(),
          file,
          preview: URL.createObjectURL(file),
          filename: getNameWithoutExtension(file.name),
          folder: "default",
          status: "pending" as const,
        });
      });

      if (unsupportedNames.length > 0) {
        unsupportedNames.forEach((name) => {
          toast.warning(
            ui.uploadSection.unsupportedType.replace("{name}", name),
          );
        });
      }

      if (duplicateNames.length > 0) {
        const names = duplicateNames.slice(0, 3).join(", ");
        const more =
          duplicateNames.length > 3 ? ` +${duplicateNames.length - 3}` : "";

        toast.warning(
          ui.uploadSection.duplicateInQueue.replace(
            "{names}",
            `${names}${more}`,
          ),
        );
      }

      if (libraryDuplicateNames.length > 0) {
        const names = libraryDuplicateNames.slice(0, 3).join(", ");
        const more =
          libraryDuplicateNames.length > 3
            ? ` +${libraryDuplicateNames.length - 3}`
            : "";

        toast.warning(
          ui.uploadSection.duplicateInLibrary.replace(
            "{names}",
            `${names}${more}`,
          ),
        );
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [files, existingNames, target],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);

      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);

      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const updateFilename = useCallback((id: string, filename: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, filename } : f)));
  }, []);

  const updateFolder = useCallback((id: string, folder: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, folder } : f)));
  }, []);

  const clearAll = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setProgress({ completed: 0, total: 0 });
  }, [files]);

  const handleUploadAll = useCallback(
    async (uploadOptions: MultiUploadOptions = {}) => {
      const pendingFiles = files.filter((f) => f.status === "pending");

      if (pendingFiles.length === 0) return;

      setUploading(true);
      setProgress({ completed: 0, total: pendingFiles.length });

      const uploadedUrls: string[] = [];
      let completedCount = 0;

      for (const fileItem of pendingFiles) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "uploading" as const } : f,
          ),
        );

        try {
          let data: { url: string };

          const folderArg =
            fileItem.folder && fileItem.folder !== "default"
              ? fileItem.folder
              : undefined;

          if (target === "files") {
            data = await uploadFile({
              file: fileItem.file,
              folder: folderArg,
              filename: fileItem.filename,
            });
          } else {
            data = await uploadMedia({
              file: fileItem.file,
              folder: folderArg,
              filename: fileItem.filename,
            });
          }

          uploadedUrls.push(data.url);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, status: "done" as const, url: data.url }
                : f,
            ),
          );

          completedCount++;
          setProgress({
            completed: completedCount,
            total: pendingFiles.length,
          });
          uploadOptions.onProgress?.(completedCount, pendingFiles.length);
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : ui.uploadSection.uploadFailed;

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, status: "error" as const, error: errorMessage }
                : f,
            ),
          );

          console.error(`Upload failed for ${fileItem.filename}:`, error);
        }
      }

      setUploading(false);

      // Clear successfully uploaded files after a short delay
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "done"));
      }, 2000);

      if (uploadedUrls.length > 0) {
        uploadOptions.onSuccess?.(uploadedUrls);
      }
    },
    [files, target, uploadMedia, uploadFile],
  );

  return {
    files,
    uploading,
    progress,
    handleFilesChange,
    handleUploadAll,
    removeFile,
    updateFilename,
    updateFolder,
    clearAll,
  };
}
