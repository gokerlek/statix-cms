import { Control, Controller } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ContentFormValues } from "@/types/content";

import { StatusBadge } from "./StatusBadge";

interface StatusSelectorProps {
  control: Control<ContentFormValues>;
}

export function StatusSelector({ control }: StatusSelectorProps) {
  return (
    <Controller
      render={({ field: { onChange, value, disabled } }) => (
        <Select
          value={value}
          onValueChange={(val) => {
            if (val) onChange(val);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[140px]">
            <div className="flex items-center gap-2">
              <StatusBadge status={value || "draft"} />
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="draft">
              <div className="flex items-center gap-2">
                <StatusBadge status="draft" />
              </div>
            </SelectItem>

            <SelectItem value="published">
              <div className="flex items-center gap-2">
                <StatusBadge status="published" />
              </div>
            </SelectItem>

            <SelectItem value="archived">
              <div className="flex items-center gap-2">
                <StatusBadge status="archived" />
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
      name="status"
      control={control}
    />
  );
}
