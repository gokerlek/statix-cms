import { useCallback, useState } from "react";

import { useUploadMedia } from "./use-media";

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

export function useFileUpload(): FileUploadState & FileUploadActions {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [filename, setFilename] = useState("");

  const { mutateAsync: uploadMedia, isPending: uploading } = useUploadMedia();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      if (selectedFile) {
        setFile(selectedFile);
        setFilename(selectedFile.name.split(".")[0]); // Remove extension for initial name
        const objectUrl = URL.createObjectURL(selectedFile);

        setPreview(objectUrl);
      }
    },
    [],
  );

  const clearFile = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview(null);
    setFilename("");
  }, [preview]);

  const handleUpload = useCallback(
    async (options: UploadOptions = {}) => {
      if (!file) return;

      try {
        const uploadFilename = options.filename || filename;

        const data = await uploadMedia({
          file,
          folder:
            options.folder && options.folder !== "default"
              ? options.folder
              : undefined,
          filename: uploadFilename,
        });

        console.log(`Upload successful: ${data.url}`);

        // Clear file state
        clearFile();

        // Call success callback if provided
        if (options.onSuccess) {
          options.onSuccess(data.url);
        }
      } catch (error) {
        const uploadError =
          error instanceof Error ? error : new Error("Upload failed");

        console.error("Upload error:", uploadError);

        // Call error callback if provided
        if (options.onError) {
          options.onError(uploadError);
        }
      }
    },
    [file, filename, clearFile, uploadMedia],
  );

  const setFilenameState = useCallback((name: string) => {
    setFilename(name);
  }, []);

  return {
    // State
    file,
    preview,
    uploading,
    filename,
    // Actions
    handleFileChange,
    handleUpload,
    clearFile,
    setFilename: setFilenameState,
  };
}
