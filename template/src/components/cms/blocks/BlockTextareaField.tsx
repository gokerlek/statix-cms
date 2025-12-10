"use client";

import { Label } from "@/components/ui/label";
import { Field } from "@/types/cms";

import { BufferedTextArea } from "../BufferedTextArea";

interface BlockTextareaFieldProps {
  field: Field;
  value: string;
  onUpdate: (value: string) => void;
}

export function BlockTextareaField({
  field,
  value,
  onUpdate,
}: BlockTextareaFieldProps) {
  return (
    <div>
      <Label className="mb-1">
        {field.label}

        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <BufferedTextArea
        value={value}
        onChange={onUpdate}
        placeholder={"placeholder" in field ? field.placeholder : ""}
        rows={"rows" in field ? field.rows : 4}
        className="font-mono text-sm"
      />
    </div>
  );
}
