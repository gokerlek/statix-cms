"use client";

import { Control, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberField as NumberFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface NumberFieldProps {
  field: NumberFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

export function NumberField({ field, control, name }: NumberFieldProps) {
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
              type="number"
              {...formField}
              value={(formField.value as number | string) ?? ""}
              min={field.min}
              max={field.max}
              onChange={(e) => formField.onChange(Number(e.target.value))}
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
