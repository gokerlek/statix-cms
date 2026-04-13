"use client";

import React, { cloneElement, MouseEvent, ReactElement } from "react";

import { IconPhoto } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import ui from "@/statix/content/ui.json";
import { useMediaStore } from "@/statix/stores/useMediaStore";

interface MediaPickerProps {
  onSelect: (url: string) => void;
  trigger?: ReactElement<{ onClick?: (e: MouseEvent) => void }>;
}

export function MediaPicker({ onSelect, trigger }: MediaPickerProps) {
  const { openDrawer } = useMediaStore();

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDrawer("select", onSelect);
  };

  if (trigger) {
    return cloneElement(trigger, {
      onClick: handleClick,
    });
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleClick}
      type="button"
    >
      <IconPhoto className="w-4 h-4" />

      {ui.mediaPicker.selectMedia}
    </Button>
  );
}
