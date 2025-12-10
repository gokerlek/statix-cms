"use client";

import { Control, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextField as TextFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface TextFieldProps {
  field: TextFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

export function TextField({ field, control, name }: TextFieldProps) {
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
            <Input
              {...formField}
              value={(formField.value as string) ?? ""}
              type="text"
              placeholder={field.placeholder}
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
