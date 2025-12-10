"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Control, Controller } from "react-hook-form";

import { Edit, FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ui from "@/content/ui.json";
import { formatFileSize } from "@/lib/utils";
import { FileField as FileFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

import { FieldPreview } from "../shared/FieldPreview";

interface FileFieldProps {
  field: FileFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

// Get file extension from path
function getFileExtension(path: string): string {
  return path.split(".").pop()?.toUpperCase() || "FILE";
}

// Get file icon color based on extension
function getFileIconColor(extension: string): string {
  const colors: Record<string, string> = {
    PDF: "text-red-500",
    DOC: "text-blue-500",
    DOCX: "text-blue-500",
    XLS: "text-green-500",
    XLSX: "text-green-500",
    PPT: "text-orange-500",
    PPTX: "text-orange-500",
    ZIP: "text-yellow-500",
    RAR: "text-yellow-500",
    TXT: "text-gray-500",
    CSV: "text-green-600",
    JSON: "text-purple-500",
    XML: "text-teal-500",
  };

  return colors[extension] || "text-muted-foreground";
}

export function FileField({ field, control, name }: FileFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type if accept is specified
    if (field.accept && field.accept.length > 0) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;

      if (!field.accept.includes(ext)) {
        toast.error(
          `${ui.fileField.acceptedTypes}: ${field.accept.join(", ")}`,
        );

        return;
      }
    }

    // Validate file size if maxSize is specified
    if (field.maxSize && file.size > field.maxSize) {
      toast.error(`${ui.fileField.maxSize}: ${formatFileSize(field.maxSize)}`);

      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      onChange(data.path);
      toast.success(ui.toasts.success.upload);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(ui.toasts.error.upload);
    } finally {
      setIsUploading(false);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (
    currentPath: string,
    onChange: (value: string) => void,
  ) => {
    setIsDeleting(true);

    try {
      const response = await fetch("/api/file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: currentPath }),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Delete failed");
      }

      onChange("");
      toast.success(ui.toasts.success.delete);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(ui.toasts.error.delete);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.label}

        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={{ required: field.required }}
        render={({ field: formField, fieldState }) => {
          const filePath = formField.value as string;
          const fileName = filePath?.split("/").pop() || "";
          const fileExtension = getFileExtension(fileName);
          const iconColor = getFileIconColor(fileExtension);

          return (
            <div className="space-y-4 rounded-lg overflow-hidden border border-border p-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={field.accept?.join(",")}
                onChange={(e) => handleUpload(e, formField.onChange)}
                className="hidden"
              />

              {formField.value ? (
                <FieldPreview
                  path={filePath}
                  preview={
                    <div className="flex flex-col items-center gap-1">
                      <FileIcon className={`size-10 ${iconColor}`} />

                      <span className="text-xs font-medium text-muted-foreground">
                        {fileExtension}
                      </span>
                    </div>
                  }
                  editTrigger={
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Edit className="size-4" />
                      )}
                    </Button>
                  }
                  onDelete={() => handleDelete(filePath, formField.onChange)}
                  isDeleting={isDeleting}
                />
              ) : (
                <div
                  className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg justify-center bg-muted/50 text-center cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="size-8 animate-spin text-muted-foreground" />

                      <p className="text-sm text-muted-foreground">
                        {ui.fileField.uploading}
                      </p>
                    </div>
                  ) : (
                    <>
                      <FileIcon className="size-12 text-muted-foreground" />

                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {ui.fileField.clickToUpload}
                        </p>

                        {field.accept && (
                          <p className="text-xs text-muted-foreground">
                            {ui.fileField.acceptedTypes}:{" "}
                            {field.accept.join(", ")}
                          </p>
                        )}

                        {field.maxSize && (
                          <p className="text-xs text-muted-foreground">
                            {ui.fileField.maxSize}:{" "}
                            {formatFileSize(field.maxSize)}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {fieldState.error && (
                <p className="text-sm text-destructive mt-1">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
