"use client";

import dynamic from "next/dynamic";
import { Control } from "react-hook-form";

import { Label } from "@/statix/components/ui/label";
import { Skeleton } from "@/statix/components/ui/skeleton";
import { Field } from "@/statix/types/cms";
import { ContentFormValues } from "@/statix/types/content";

import { BlockEditor } from "./BlockEditor";
import { CheckboxField } from "@/statix/components/fields/CheckboxField";
import { DateField } from "@/statix/components/fields/DateField";
import { FileField } from "@/statix/components/fields/FileField";
import { ImageField } from "@/statix/components/fields/ImageField";
import { NumberField } from "@/statix/components/fields/NumberField";
import { SelectField } from "@/statix/components/fields/SelectField";
import { SwitchField } from "@/statix/components/fields/SwitchField";
import { TextareaField } from "@/statix/components/fields/TextareaField";
import { TextField } from "@/statix/components/fields/TextField";
import { ListEditor } from "./ListEditor";

const RichTextField = dynamic(
  () => import("@/statix/components/fields/RichTextField").then((m) => m.RichTextField),
  { ssr: false, loading: () => <Skeleton className="h-48 w-full" /> },
);

interface FieldRendererProps {
  field: Field;
  control: Control<ContentFormValues>;
  name?: string; // Allow overriding the field name (e.g., for localized fields)
  structureLocked?: boolean;
  ignoreRequired?: boolean;
}

export function FieldRenderer({
  field,
  control,
  name,
  structureLocked,
  ignoreRequired,
}: FieldRendererProps) {
  const fieldName = name || field.name;

  function getEffectiveField<T extends Field>(f: T): T {
    if (!ignoreRequired) return f;

    return { ...f, required: false };
  }

  switch (field.type) {
    case "list":
      return (
        <ListEditor
          name={fieldName}
          control={control}
          fields={field.fields}
          label={field.label}
          locked={structureLocked}
        />
      );

    case "blocks": {
      const effectiveField = getEffectiveField(field);

      return (
        <div className="space-y-2">
          <Label>
            {field.label}

            {effectiveField.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>

          <BlockEditor
            name={fieldName}
            control={control}
            blockTypes={field.blocks}
            locked={structureLocked}
          />
        </div>
      );
    }

    case "textarea":
      return (
        <TextareaField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "richtext":
      return (
        <RichTextField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "image":
      return (
        <ImageField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "file":
      return (
        <FileField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "select":
      return (
        <SelectField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "number":
      return (
        <NumberField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "date":
      return (
        <DateField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "checkbox":
      return (
        <CheckboxField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "switch":
      return (
        <SwitchField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    case "text":
      return (
        <TextField
          field={getEffectiveField(field)}
          control={control}
          name={fieldName}
        />
      );

    default:
      return null;
  }
}
