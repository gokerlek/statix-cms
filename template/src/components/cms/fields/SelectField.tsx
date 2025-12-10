"use client";

import { Control, Controller } from "react-hook-form";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectField as SelectFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface SelectFieldProps {
  field: SelectFieldType;
  control: Control<ContentFormValues>;
  name: string;
}

export function SelectField({ field, control, name }: SelectFieldProps) {
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
            <Select
              onValueChange={formField.onChange}
              value={(formField.value as string) || ""}
            >
              <SelectTrigger
                className={fieldState.error ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>

              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
