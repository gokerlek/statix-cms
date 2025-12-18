"use client";

import { Control, Controller } from "react-hook-form";

import { Block, BlockType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

import { DirectRichTextField } from "../fields/RichTextField";
import { BlockImageField } from "./BlockImageField";
import { BlockTextareaField } from "./BlockTextareaField";
import { BlockTextField } from "./BlockTextField";

interface BlockFieldRendererProps {
  block: Block;
  blockType: BlockType;
  control: Control<ContentFormValues>;
  blockIndex: number;
  blockFieldName: string; // e.g., "content" for blocks field
}

export function BlockFieldRenderer({
  block,
  blockType,
  control,
  blockIndex,
  blockFieldName,
}: BlockFieldRendererProps) {
  return (
    <div className="space-y-3">
      {blockType.fields?.map((field) => {
        const fieldPath = `${blockFieldName}.${blockIndex}.${field.name}`;

        if (field.type === "textarea") {
          return (
            <Controller
              key={`${block.id}-${field.name}`}
              name={fieldPath}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField, fieldState }) => (
                <BlockTextareaField
                  field={field}
                  value={(formField.value as string) || ""}
                  onUpdate={formField.onChange}
                  error={!!fieldState.error}
                />
              )}
            />
          );
        }

        if (field.type === "richtext") {
          return (
            <Controller
              key={`${block.id}-${field.name}`}
              name={fieldPath}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField, fieldState }) => (
                <DirectRichTextField
                  field={field}
                  value={(formField.value as string) || ""}
                  onChange={formField.onChange}
                  variant="block"
                  error={!!fieldState.error}
                />
              )}
            />
          );
        }

        if (field.type === "image") {
          return (
            <Controller
              key={`${block.id}-${field.name}`}
              name={fieldPath}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField, fieldState }) => (
                <BlockImageField
                  field={field}
                  value={(formField.value as string) || ""}
                  onUpdate={formField.onChange}
                  error={!!fieldState.error}
                />
              )}
            />
          );
        }

        // Default: text input
        return (
          <Controller
            key={`${block.id}-${field.name}`}
            name={fieldPath}
            control={control}
            rules={{ required: field.required }}
            render={({ field: formField, fieldState }) => (
              <BlockTextField
                field={field}
                value={(formField.value as string) || ""}
                onUpdate={formField.onChange}
                error={!!fieldState.error}
              />
            )}
          />
        );
      })}
    </div>
  );
}
