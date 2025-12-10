"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Block, BlockType } from "@/types/cms";

import { BlockFieldRenderer } from "./blocks/BlockFieldRenderer";
import { BlockHeader } from "./blocks/BlockHeader";

interface SortableBlockProps {
  block: Block;
  blockType: BlockType;
  onRemove: () => void;
  onUpdate: (field: string, value: unknown) => void;
}

export function SortableBlock({
  block,
  blockType,
  onRemove,
  onUpdate,
}: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className={cn("p-4", isDragging && "opacity-50 shadow-2xl")}>
        <BlockHeader
          label={blockType.label}
          onRemove={onRemove}
          dragAttributes={attributes}
          dragListeners={listeners}
        />

        <div className="pl-8">
          <BlockFieldRenderer
            block={block}
            blockType={blockType}
            onUpdate={onUpdate}
          />
        </div>
      </Card>
    </div>
  );
}
