"use client";

import React from "react";
import { Control } from "react-hook-form";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import { Card } from "@/statix/components/ui/card";
import { cn } from "@/statix/lib/utils";
import { Field } from "@/statix/types/cms";
import { ContentFormValues } from "@/statix/types/content";

import { ListItemFieldRenderer } from "@/statix/components/fields/list-items/ListItemFieldRenderer";

interface SortableListItemProps {
  id: string;
  index: number;
  fields: Field[];
  onRemove?: () => void;
  control: Control<ContentFormValues>;
  itemIndex: number;
  listFieldName: string;
  locked?: boolean;
}

function SortableListItemInner({
  id,
  fields,
  onRemove,
  control,
  itemIndex,
  listFieldName,
  locked,
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
    disabled: locked,
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
          {!locked && (
            <button
              type="button"
              className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground outline-none"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <IconGripVertical className="w-5 h-5" />
            </button>
          )}

          <ListItemFieldRenderer
            fields={fields}
            control={control}
            itemIndex={itemIndex}
            listFieldName={listFieldName}
          />

          {!locked && onRemove && (
            <Button
              type="button"
              variant="destructive_ghost"
              size="icon"
              onClick={onRemove}
              aria-label="Remove item"
            >
              <IconTrash className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export const SortableListItem = React.memo(SortableListItemInner);
