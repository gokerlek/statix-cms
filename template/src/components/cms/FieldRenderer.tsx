"use client";

import { Control } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Field } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

import { BlockEditor } from "./BlockEditor";
import { CheckboxField } from "./fields/CheckboxField";
import { DateField } from "./fields/DateField";
import { FileField } from "./fields/FileField";
import { ImageField } from "./fields/ImageField";
import { NumberField } from "./fields/NumberField";
import { SelectField } from "./fields/SelectField";
import { SwitchField } from "./fields/SwitchField";
import { TextareaField } from "./fields/TextareaField";
import { TextField } from "./fields/TextField";
import { ListEditor } from "./ListEditor";

interface FieldRendererProps {
  field: Field;
  control: Control<ContentFormValues>;
  name?: string; // Allow overriding the field name (e.g., for localized fields)
}

export function FieldRenderer({ field, control, name }: FieldRendererProps) {
  const fieldName = name || field.name;

  switch (field.type) {
    case "list":
      return (
        <ListEditor
          name={fieldName}
          control={control}
          fields={field.fields}
          label={field.label}
        />
      );

    case "blocks":
      return (
        <div className="space-y-2">
          <Label>
            {field.label}

            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          <BlockEditor
            name={fieldName}
            control={control}
            blockTypes={field.blocks}
          />
        </div>
      );

    case "textarea":
      return <TextareaField field={field} control={control} name={fieldName} />;

    case "image":
      return <ImageField field={field} control={control} name={fieldName} />;

    case "file":
      return <FileField field={field} control={control} name={fieldName} />;

    case "select":
      return <SelectField field={field} control={control} name={fieldName} />;

    case "number":
      return <NumberField field={field} control={control} name={fieldName} />;

    case "date":
      return <DateField field={field} control={control} name={fieldName} />;

    case "checkbox":
      return <CheckboxField field={field} control={control} name={fieldName} />;

    case "switch":
      return <SwitchField field={field} control={control} name={fieldName} />;

    case "text":
      return <TextField field={field} control={control} name={fieldName} />;

    default:
      return null;
  }
}
