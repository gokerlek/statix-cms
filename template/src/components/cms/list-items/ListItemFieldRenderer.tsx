"use client";

import { Control, Controller } from "react-hook-form";

import { Field } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

import { DirectRichTextField } from "../fields/RichTextField";
import { ListItemImageField } from "./ListItemImageField";
import { ListItemSelectField } from "./ListItemSelectField";
import { ListItemTextareaField } from "./ListItemTextareaField";
import { ListItemTextField } from "./ListItemTextField";

interface ListItemFieldRendererProps {
  item: Record<string, unknown>;
  fields: Field[];
  control: Control<ContentFormValues>;
  itemIndex: number;
  listFieldName: string;
}

export function ListItemFieldRenderer({
  fields,
  control,
  itemIndex,
  listFieldName,
}: Omit<ListItemFieldRendererProps, "item">) {
  return (
    <div className="flex-1 space-y-4">
      {fields.map((field) => {
        const fieldPath = `${listFieldName}.${itemIndex}.${field.name}`;

        if (field.type === "textarea") {
          return (
            <Controller
              key={field.name}
              name={fieldPath}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField, fieldState }) => (
                <ListItemTextareaField
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
              key={field.name}
              name={fieldPath}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField, fieldState }) => (
                <DirectRichTextField
                  field={field}
                  value={(formField.value as string) || ""}
                  onChange={formField.onChange}
                  variant="compact"
                  error={!!fieldState.error}
                />
              )}
            />
          );
        }

        if (field.type === "image") {
          return (
            <Controller
              key={field.name}
              name={fieldPath}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField, fieldState }) => (
                <ListItemImageField
                  field={field}
                  value={(formField.value as string) || ""}
                  onUpdate={formField.onChange}
                  error={!!fieldState.error}
                />
              )}
            />
          );
        }

        if (field.type === "select") {
          return (
            <Controller
              key={field.name}
              name={fieldPath}
              control={control}
              rules={{ required: field.required }}
              render={({ field: formField, fieldState }) => (
                <ListItemSelectField
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
            key={field.name}
            name={fieldPath}
            control={control}
            rules={{ required: field.required }}
            render={({ field: formField, fieldState }) => (
              <ListItemTextField
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
