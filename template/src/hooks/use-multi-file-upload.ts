import { useCallback, useState } from "react";

import { toast } from "sonner";

import { useMedia, useUploadMedia } from "./use-media";

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

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useMultiFileUpload(): MultiFileUploadState &
  MultiFileUploadActions {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const { mutateAsync: uploadMedia } = useUploadMedia();
  const { data: existingMedia } = useMedia();

  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;

      if (!selectedFiles || selectedFiles.length === 0) return;

      // Sanitize filename to match how files are stored (spaces -> underscores)
      const sanitizeFilename = (name: string) =>
        name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();

      // Create set of existing file names from current queue (sanitized)
      const existingQueueNames = new Set(
        files.map((f) => sanitizeFilename(f.file.name)),
      );

      // Create set of existing file names from media library (already sanitized)
      const existingMediaNames = new Set(
        existingMedia?.map((m) => {
          // Extract filename from path (e.g., "public/uploads/image.jpg" -> "image.jpg")
          const filename = m.path.split("/").pop() || "";

          return filename.toLowerCase();
        }) || [],
      );

      // DEBUG: Log for troubleshooting
      console.log("=== DUPLICATE CHECK DEBUG ===");
      console.log("existingMedia count:", existingMedia?.length || 0);
      console.log("existingMediaNames:", Array.from(existingMediaNames));

      const newFiles: FileItem[] = [];
      const duplicateNames: string[] = [];
      const existingNames: string[] = [];

      Array.from(selectedFiles).forEach((file) => {
        const sanitizedName = sanitizeFilename(file.name);

        // DEBUG
        console.log(
          `Checking: "${file.name}" => sanitized: "${sanitizedName}"`,
        );
        console.log(
          `  In media library: ${existingMediaNames.has(sanitizedName)}`,
        );

        // Helper to get filename without extension (only removes last extension like .png, .jpg)
        const getNameWithoutExtension = (name: string) => {
          const lastDotIndex = name.lastIndexOf(".");

          return lastDotIndex > 0 ? name.substring(0, lastDotIndex) : name;
        };

        // Check if already in queue
        if (existingQueueNames.has(sanitizedName)) {
          duplicateNames.push(file.name);

          return;
        }

        // Check if already exists in media library
        if (existingMediaNames.has(sanitizedName)) {
          existingNames.push(file.name);
          // Add with duplicate status so user can see it
          newFiles.push({
            id: generateId(),
            file,
            preview: URL.createObjectURL(file),
            filename: getNameWithoutExtension(file.name),
            folder: "default",
            status: "duplicate" as const,
            error: "Bu dosya zaten mevcut",
          });

          return;
        }

        // Add as pending
        newFiles.push({
          id: generateId(),
          file,
          preview: URL.createObjectURL(file),
          filename: getNameWithoutExtension(file.name),
          folder: "default",
          status: "pending" as const,
        });
      });

      if (duplicateNames.length > 0) {
        const names = duplicateNames.slice(0, 3).join(", ");
        const more =
          duplicateNames.length > 3
            ? ` +${duplicateNames.length - 3} daha`
            : "";

        toast.warning(`Zaten listede: ${names}${more}`);
      }

      if (existingNames.length > 0) {
        const names = existingNames.slice(0, 3).join(", ");
        const more =
          existingNames.length > 3 ? ` +${existingNames.length - 3} daha` : "";

        toast.warning(`Zaten yüklenmiş: ${names}${more}`);
      }

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
      }
    },
    [files, existingMedia],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);

      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }

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
    async (options: MultiUploadOptions = {}) => {
      const pendingFiles = files.filter((f) => f.status === "pending");

      if (pendingFiles.length === 0) return;

      setUploading(true);
      setProgress({ completed: 0, total: pendingFiles.length });

      const uploadedUrls: string[] = [];
      let completedCount = 0;

      for (const fileItem of pendingFiles) {
        // Mark as uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "uploading" as const } : f,
          ),
        );

        try {
          const data = await uploadMedia({
            file: fileItem.file,
            folder:
              fileItem.folder && fileItem.folder !== "default"
                ? fileItem.folder
                : undefined,
            filename: fileItem.filename,
          });

          uploadedUrls.push(data.url);

          // Mark as done
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
          options.onProgress?.(completedCount, pendingFiles.length);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Upload failed";

          // Mark as error
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
        options.onSuccess?.(uploadedUrls);
      }
    },
    [files, uploadMedia],
  );

  return {
    // State
    files,
    uploading,
    progress,
    // Actions
    handleFilesChange,
    handleUploadAll,
    removeFile,
    updateFilename,
    updateFolder,
    clearAll,
  };
}
