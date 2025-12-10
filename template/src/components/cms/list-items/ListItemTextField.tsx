"use client";

import { Label } from "@/components/ui/label";
import { Field } from "@/types/cms";

import { BufferedInput } from "../BufferedInput";

interface ListItemTextFieldProps {
  field: Field;
  value: string;
  onUpdate: (value: string) => void;
}

export function ListItemTextField({
  field,
  value,
  onUpdate,
}: ListItemTextFieldProps) {
  return (
    <div>
      <Label className="mb-1">
        {field.label}

        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <BufferedInput
        value={value}
        onChange={onUpdate}
        placeholder={"placeholder" in field ? field.placeholder : ""}
      />
    </div>
  );
}
