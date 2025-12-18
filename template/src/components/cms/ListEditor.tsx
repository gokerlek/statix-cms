"use client";

import { Control, useFieldArray } from "react-hook-form";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ui from "@/content/ui.json";
import { Field } from "@/types/cms";

import { SortableListItem } from "./SortableListItem";

interface ListEditorProps {
  name: string;
  control: Control<Record<string, unknown>>;
  fields: Field[];
  label: string;
  locked?: boolean;
}

export function ListEditor({
  name,
  control,
  fields,
  label,
  locked,
}: ListEditorProps) {
  const {
    fields: items,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: name as never,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      move(oldIndex, newIndex);
    }
  };

  const addItem = () => {
    const newItem: Record<string, unknown> = {
      id: crypto.randomUUID(),
    };

    fields.forEach((field) => {
      newItem[field.name] = "";
    });
    append(newItem);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base">{label}</Label>

        {!locked && (
          <Button type="button" onClick={addItem} size="sm" className="gap-1">
            <Plus className="w-4 h-4" />

            {ui.listEditor.addItem}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <p className="text-muted-foreground text-sm">
            {ui.listEditor.noItems}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableListItem
                  key={item.id}
                  id={item.id}
                  index={index}
                  fields={fields}
                  onRemove={locked ? undefined : () => remove(index)}
                  control={control}
                  itemIndex={index}
                  listFieldName={name}
                  locked={locked}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
