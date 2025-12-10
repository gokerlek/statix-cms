"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Field } from "@/types/cms";

import { ListItemFieldRenderer } from "./list-items/ListItemFieldRenderer";

interface SortableListItemProps {
  id: string;
  index: number;
  item: Record<string, unknown>;
  fields: Field[];
  onRemove: () => void;
  onUpdate: (field: string, value: unknown) => void;
}

export function SortableListItem({
  id,
  item,
  fields,
  onUpdate,
  onRemove,
}: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card
        className={cn(
          "p-4",
          isDragging && "opacity-50 shadow-2xl relative z-50",
        )}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground outline-none"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-5 h-5" />
          </button>

          <ListItemFieldRenderer
            item={item}
            fields={fields}
            onUpdate={onUpdate}
          />

          <Button
            type="button"
            variant="destructive_ghost"
            size="icon"
            onClick={onRemove}
            aria-label="Remove item"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
