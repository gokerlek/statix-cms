"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectField } from "@/types/cms";

interface ListItemSelectFieldProps {
  field: SelectField;
  value: string;
  onUpdate: (value: string) => void;
}

export function ListItemSelectField({
  field,
  value,
  onUpdate,
}: ListItemSelectFieldProps) {
  return (
    <div>
      <Label className="mb-1">
        {field.label}

        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Select value={value} onValueChange={onUpdate}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>

        <SelectContent>
          {field.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
