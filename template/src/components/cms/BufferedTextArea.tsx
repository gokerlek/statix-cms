"use client";

import { useEffect, useState } from "react";

import { Textarea } from "@/components/ui/textarea";

interface BufferedTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function BufferedTextArea({
  value,
  onChange,
  placeholder,
  rows,
  className,
}: BufferedTextAreaProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Textarea
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      placeholder={placeholder}
      rows={rows}
      className={className}
    />
  );
}
