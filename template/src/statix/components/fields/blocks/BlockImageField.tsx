"use client";

import { IconPhoto, IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import { Label } from "@/statix/components/ui/label";
import { resolveImageUrl } from "@/statix/lib/utils";
import { useMediaStore } from "@/statix/stores/useMediaStore";
import { Field } from "@/statix/types/cms";

import { MediaPicker } from "@/statix/components/media/MediaPicker";

interface BlockImageFieldProps {
  field: Field;
  value: string;
  onUpdate: (value: string) => void;
  error?: boolean;
}

export function BlockImageField({
  field,
  value,
  onUpdate,
  error,
}: BlockImageFieldProps) {
  const { openDrawer } = useMediaStore();

  return (
    <div className="space-y-2">
      <Label>
        {field.label}

        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {value ? (
        <div
          className={`relative w-full h-48 bg-muted rounded-md overflow-hidden border ${error ? "border-destructive" : "border-border"} group`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl(value)}
            alt="Preview"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <MediaPicker
              onSelect={onUpdate}
              trigger={
                <Button variant="secondary" size="sm" type="button">
                  Change
                </Button>
              }
            />
          </div>

          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onUpdate("")}
            type="button"
          >
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`flex flex-col items-center gap-4 p-8 border-2 border-dashed ${error ? "border-destructive/50" : "border-muted-foreground/25"} rounded-lg justify-center bg-muted/50`}
        >
          <div className="flex items-center gap-4">
            <MediaPicker
              onSelect={onUpdate}
              trigger={
                <Button variant="secondary" type="button">
                  <IconPhoto className="mr-2 h-4 w-4" />
                  Select from Gallery
                </Button>
              }
            />

            <span className="text-muted-foreground text-sm">or</span>

            <Button
              variant="outline"
              onClick={() => openDrawer("select", onUpdate)}
              type="button"
            >
              <IconPlus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
