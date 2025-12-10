"use client";

import { Control, Controller } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SwitchField as SwitchFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface SwitchFieldProps {
  field: SwitchFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

export function SwitchField({ field, control, name }: SwitchFieldProps) {
  return (
    <div className="space-y-2">
      <Controller
        name={name}
        control={control}
        rules={{ required: field.required }}
        render={({ field: formField, fieldState }) => (
          <div className="flex items-center space-x-2">
            <Switch
              id={name}
              checked={!!formField.value}
              onCheckedChange={formField.onChange}
            />

            <Label
              htmlFor={name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}

              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>

            {fieldState.error && (
              <p className="text-sm text-destructive ml-2">
                {fieldState.error.message}
              </p>
            )}
          </div>
        )}
      />
    </div>
  );
}
