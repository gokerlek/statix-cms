"use client";

import { DraggableSyntheticListeners } from "@dnd-kit/core";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { DragAttributes } from "@/types/form";

interface BlockHeaderProps {
  label: string;
  onRemove?: () => void;
  dragAttributes: DragAttributes;
  dragListeners: DraggableSyntheticListeners;
  locked?: boolean;
}

export function BlockHeader({
  label,
  onRemove,
  dragAttributes,
  dragListeners,
  locked,
}: BlockHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      {!locked && (
        <button
          type="button"
          className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground outline-none"
          {...dragAttributes}
          {...dragListeners}
        >
          <IconGripVertical className="w-5 h-5" />
        </button>
      )}

      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <small>{label}</small>

          {!locked && onRemove && (
            <Button
              type="button"
              variant="destructive_ghost"
              size="icon"
              onClick={onRemove}
            >
              <IconTrash className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
