"use client";

import { Control, Controller } from "react-hook-form";

import { IconEdit, IconPhoto, IconPlus } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import { Label } from "@/statix/components/ui/label";
import ui from "@/statix/content/ui.json";
import { resolveImageUrl } from "@/statix/lib/utils";
import { useMediaStore } from "@/statix/stores/useMediaStore";
import { ImageField as ImageFieldType } from "@/statix/types/cms";
import { ContentFormValues } from "@/statix/types/content";

import { MediaPicker } from "@/statix/components/media/MediaPicker";
import { FieldPreview } from "../shared/FieldPreview";

interface ImageFieldProps {
  field: ImageFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

export function ImageField({ field, control, name }: ImageFieldProps) {
  const { openDrawer } = useMediaStore();

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
        render={({ field: formField, fieldState }) => (
          <div className="space-y-4 rounded-lg overflow-hidden border border-border p-4">
            {formField.value ? (
              <FieldPreview
                path={formField.value as string}
                preview={
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImageUrl(formField.value as string)}
                    alt={ui.imageField.preview}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                }
                editTrigger={
                  <MediaPicker
                    onSelect={formField.onChange}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <IconEdit className="size-4" />
                      </Button>
                    }
                  />
                }
                onDelete={() => formField.onChange("")}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg justify-center bg-muted/50 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <MediaPicker
                    onSelect={formField.onChange}
                    trigger={
                      <Button variant="secondary" type="button">
                        <IconPhoto className="mr-2 h-4 w-4" />

                        {ui.imageField.selectFromGallery}
                      </Button>
                    }
                  />

                  <span className="text-muted-foreground text-sm">
                    {ui.imageField.or}
                  </span>

                  <Button
                    variant="outline"
                    onClick={() => openDrawer("select", formField.onChange)}
                    type="button"
                  >
                    <IconPlus className="mr-2 h-4 w-4" />

                    {ui.imageField.addNew}
                  </Button>
                </div>
              </div>
            )}

            {fieldState.error && (
              <p className="text-sm text-destructive mt-1">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}
