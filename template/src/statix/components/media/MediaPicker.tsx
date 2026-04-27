"use client";

import React, { cloneElement, MouseEvent, ReactElement } from "react";

import { IconPhoto } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import ui from "@/statix/content/ui.json";
import {
  type MediaStoreTarget,
  useMediaStore,
} from "@/statix/stores/useMediaStore";

interface MediaPickerProps {
  onSelect: (value: string) => void;
  trigger?: ReactElement<{ onClick?: (e: MouseEvent) => void }>;
  /**
   * Drawer bucket — `"media"` (default) opens the image library;
   * `"files"` switches to the documents bucket so `FileField` can
   * reuse the same drawer chrome.
   */
  target?: MediaStoreTarget;
  /** Initial drawer tab — defaults to library select. */
  mode?: "select" | "upload";
}

export function MediaPicker({
  onSelect,
  trigger,
  target = "media",
  mode = "select",
}: MediaPickerProps) {
  const { openDrawer } = useMediaStore();

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDrawer(mode, onSelect, target);
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
