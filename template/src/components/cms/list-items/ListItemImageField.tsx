"use client";

import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveImageUrl } from "@/lib/utils";
import { useMediaStore } from "@/stores/useMediaStore";
import { Field } from "@/types/cms";

import { MediaPicker } from "../MediaPicker";

interface ListItemImageFieldProps {
  field: Field;
  value: string;
  onUpdate: (value: string) => void;
}

export function ListItemImageField({
  field,
  value,
  onUpdate,
}: ListItemImageFieldProps) {
  const { openDrawer } = useMediaStore();

  return (
    <div>
      <Label className="mb-1">
        {field.label}

        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden border border-border shrink-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImageUrl(value)}
              alt="Preview"
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <MediaPicker
                onSelect={onUpdate}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                }
              />
            </div>

            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onUpdate("")}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MediaPicker
              onSelect={onUpdate}
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 shrink-0"
                  title="Select from Gallery"
                >
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
              }
            />

            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 shrink-0"
              onClick={() => openDrawer("select", onUpdate)}
              title="Add New"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        )}

        <div className="flex-1">
          <Input
            value={value || ""}
            onChange={(e) => onUpdate(e.target.value)}
            placeholder="Image URL or select..."
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
