"use client";

import { Control, Controller } from "react-hook-form";

import { IconEdit, IconFile, IconPlus } from "@tabler/icons-react";

import { MediaPicker } from "@/statix/components/media/MediaPicker";
import { Button } from "@/statix/components/ui/button";
import { Label } from "@/statix/components/ui/label";
import ui from "@/statix/content/ui.json";
import { useMediaStore } from "@/statix/stores/useMediaStore";
import { FileField as FileFieldType } from "@/statix/types/cms";
import { ContentFormValues } from "@/statix/types/content";

import { FieldPreview } from "../shared/FieldPreview";

interface FileFieldProps {
  field: FileFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

function getFileExtension(path: string): string {
  return path.split(".").pop()?.toUpperCase() || "FILE";
}

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

/**
 * Document picker field. Mirrors `ImageField` exactly:
 *  - drawer-only flow via `MediaPicker` (target="files") + `openDrawer`
 *    — no system file picker, no hidden `<input type="file">`
 *  - delete clears the reference; the actual document stays in the
 *    library so it can be reused across content. Permanent removal
 *    happens through `/admin/files` (which goes through trash, just
 *    like media)
 */
export function FileField({ field, control, name }: FileFieldProps) {
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
        render={({ field: formField, fieldState }) => {
          const filePath = (formField.value as string) ?? "";
          const fileName = filePath.split("/").pop() ?? "";
          const fileExtension = getFileExtension(fileName);
          const iconColor = getFileIconColor(fileExtension);

          return (
            <div className="space-y-4 rounded-lg overflow-hidden border border-border p-4">
              {filePath ? (
                <FieldPreview
                  path={filePath}
                  preview={
                    <div className="flex flex-col items-center gap-1">
                      <IconFile className={`size-10 ${iconColor}`} />
                      <span className="text-xs font-medium text-muted-foreground">
                        {fileExtension}
                      </span>
                    </div>
                  }
                  editTrigger={
                    <MediaPicker
                      target="files"
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
                  <IconFile className="size-12 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {ui.fileField.clickToUpload}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <MediaPicker
                      target="files"
                      onSelect={formField.onChange}
                      trigger={
                        <Button variant="secondary" type="button">
                          <IconFile className="mr-2 h-4 w-4" />
                          {ui.filesPage.pickFromLibrary}
                        </Button>
                      }
                    />

                    <span className="text-muted-foreground text-sm">
                      {ui.imageField.or}
                    </span>

                    <Button
                      variant="outline"
                      onClick={() =>
                        openDrawer("upload", formField.onChange, "files")
                      }
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
          );
        }}
      />
    </div>
  );
}
