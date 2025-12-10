"use client";

import { Control, Controller } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TextareaField as TextareaFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface TextareaFieldProps {
  field: TextareaFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

export function TextareaField({ field, control, name }: TextareaFieldProps) {
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
          <div>
            <Textarea
              {...formField}
              value={(formField.value as string) ?? ""}
              placeholder={field.placeholder}
              rows={field.rows || 4}
              className={fieldState.error ? "border-destructive" : ""}
            />

            {fieldState.error && (
              <p className="mt-1 text-sm text-destructive">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}
