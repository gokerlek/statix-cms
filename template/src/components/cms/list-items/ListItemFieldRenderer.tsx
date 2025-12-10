"use client";

import { Field } from "@/types/cms";

import { ListItemImageField } from "./ListItemImageField";
import { ListItemSelectField } from "./ListItemSelectField";
import { ListItemTextareaField } from "./ListItemTextareaField";
import { ListItemTextField } from "./ListItemTextField";

interface ListItemFieldRendererProps {
  item: Record<string, unknown>;
  fields: Field[];
  onUpdate: (field: string, value: unknown) => void;
}

export function ListItemFieldRenderer({
  item,
  fields,
  onUpdate,
}: ListItemFieldRendererProps) {
  return (
    <div className="flex-1 space-y-4">
      {fields.map((field) => {
        const fieldValue = (item[field.name] as string) || "";

        if (field.type === "textarea") {
          return (
            <ListItemTextareaField
              key={field.name}
              field={field}
              value={fieldValue}
              onUpdate={(val) => onUpdate(field.name, val)}
            />
          );
        }

        if (field.type === "image") {
          return (
            <ListItemImageField
              key={field.name}
              field={field}
              value={fieldValue}
              onUpdate={(val) => onUpdate(field.name, val)}
            />
          );
        }

        if (field.type === "select") {
          return (
            <ListItemSelectField
              key={field.name}
              field={field}
              value={fieldValue}
              onUpdate={(val) => onUpdate(field.name, val)}
            />
          );
        }

        // Default: text input
        return (
          <ListItemTextField
            key={field.name}
            field={field}
            value={fieldValue}
            onUpdate={(val) => onUpdate(field.name, val)}
          />
        );
      })}
    </div>
  );
}
