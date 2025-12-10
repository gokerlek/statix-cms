import React, { useRef, useState } from "react";

import { Upload } from "lucide-react";

import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  multiple?: boolean;
  children?: React.ReactNode;
}

export function UploadDropzone({
  onFileSelect,
  accept = "image/*",
  disabled = false,
  className,
  size = "md",
  multiple = false,
  children,
}: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const sizeClasses = {
    sm: "h-32 p-4",
    md: "h-64 p-6",
    lg: "h-80 p-8",
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();

    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;

    if (files.length > 0) {
      // Create a synthetic event to match the expected type
      const syntheticEvent = {
        target: {
          files: files,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      onFileSelect(syntheticEvent);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors",
        sizeClasses[size],
        {
          "hover:bg-muted/50": !disabled,
          "bg-muted/50 border-primary": isDragOver && !disabled,
          "opacity-50 cursor-not-allowed": disabled,
        },
        className,
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children || (
        <div className="flex flex-col items-center justify-center text-center">
          <Upload
            className={cn(
              "mb-4 text-muted-foreground",
              size === "sm"
                ? "w-8 h-8"
                : size === "md"
                  ? "w-12 h-12"
                  : "w-16 h-16",
            )}
          />

          <p
            className={cn(
              "mb-2 text-muted-foreground",
              size === "sm" ? "text-xs" : "text-sm",
            )}
          >
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>

          <p
            className={cn(
              "text-muted-foreground",
              size === "sm" ? "text-xs" : "text-xs",
            )}
          >
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={onFileSelect}
        disabled={disabled}
      />
    </div>
  );
}
