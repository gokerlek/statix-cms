"use client";

import { Control, useFieldArray } from "react-hook-form";

import { IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ui from "@/content/ui.json";
import {
  closestCenter,
  DndContext,
  SortableContext,
  useSortableList,
  verticalListSortingStrategy,
} from "@/hooks/use-sortable-list";
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

  const { sensors, handleDragEnd } = useSortableList({ items, move });

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
            <IconPlus className="w-4 h-4" />

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
