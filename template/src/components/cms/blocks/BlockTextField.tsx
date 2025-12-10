"use client";

import { Label } from "@/components/ui/label";
import { Field } from "@/types/cms";

import { BufferedInput } from "../BufferedInput";

interface BlockTextFieldProps {
  field: Field;
  value: string;
  onUpdate: (value: string) => void;
}

export function BlockTextField({
  field,
  value,
  onUpdate,
}: BlockTextFieldProps) {
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
