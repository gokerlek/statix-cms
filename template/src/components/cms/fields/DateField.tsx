"use client";

import { Control, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateField as DateFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface DateFieldProps {
  field: DateFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

export function DateField({ field, control, name }: DateFieldProps) {
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
              type="date"
              {...formField}
              value={(formField.value as string) || ""}
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
