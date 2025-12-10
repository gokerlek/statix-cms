"use client";

import { Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";
import { useMediaStore } from "@/stores/useMediaStore";

interface MediaPickerProps {
  onSelect: (url: string) => void;
  trigger?: React.ReactNode;
}

export function MediaPicker({ onSelect, trigger }: MediaPickerProps) {
  const { openDrawer } = useMediaStore();

  const handleClick = () => {
    openDrawer("select", onSelect);
  };

  if (trigger) {
    return (
      <div onClick={handleClick} className="cursor-pointer">
        {trigger}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleClick}
      type="button"
    >
      <ImageIcon className="w-4 h-4" />

      {ui.mediaPicker.selectMedia}
    </Button>
  );
}
