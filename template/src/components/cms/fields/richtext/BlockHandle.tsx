"use client";

import {
  BlockHandleAdd,
  BlockHandleDraggable,
  BlockHandlePopover,
} from "prosekit/react/block-handle";
import { GripVertical, Plus } from "lucide-react";

export function RichTextBlockHandle() {
  return (
    <BlockHandlePopover
      placement="left"
      className="flex items-center flex-row box-border justify-center border-0 [&:not([data-state])]:hidden will-change-transform"
    >
      <BlockHandleAdd className="flex items-center justify-center h-6 w-6 hover:bg-accent rounded-sm text-muted-foreground/50 cursor-pointer transition-colors">
        <Plus className="h-4 w-4" />
      </BlockHandleAdd>
      <BlockHandleDraggable className="flex items-center justify-center h-6 w-5 hover:bg-accent rounded-sm text-muted-foreground/50 cursor-grab transition-colors">
        <GripVertical className="h-4 w-4" />
      </BlockHandleDraggable>
    </BlockHandlePopover>
  );
}
