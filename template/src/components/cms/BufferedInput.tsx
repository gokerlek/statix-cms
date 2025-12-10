"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

interface BufferedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function BufferedInput({
  value,
  onChange,
  placeholder,
  className,
}: BufferedInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => onChange(localValue)}
      placeholder={placeholder}
      className={className}
    />
  );
}
