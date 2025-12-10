import React from "react";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  src: string;
  alt?: string;
  onClear?: () => void;
  className?: string;
  aspectRatio?: "square" | "video" | "auto";
  size?: "sm" | "md" | "lg";
  objectFit?: "cover" | "contain";
}

export function FilePreview({
  src,
  alt = "Preview",
  onClear,
  className,
  aspectRatio = "square",
  size = "md",
  objectFit = "cover",
}: FilePreviewProps) {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "aspect-auto",
  };

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-full max-w-md",
    lg: "w-full",
  };

  return (
    <div
      className={cn(
        "relative bg-muted rounded-lg overflow-hidden border",
        aspectClasses[aspectRatio],
        sizeClasses[size],
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full",
          objectFit === "cover" ? "object-cover" : "object-contain",
        )}
      />

      {onClear && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onClear}
          title="Clear preview"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
