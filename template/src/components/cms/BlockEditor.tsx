"use client";

import { Control, useFieldArray, useWatch } from "react-hook-form";

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
import ui from "@/content/ui.json";
import { Block, BlockType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

import { SortableBlock } from "./SortableBlock";

interface BlockEditorProps {
  name: string;
  control: Control<ContentFormValues>;
  blockTypes: BlockType[];
  locked?: boolean;
}

export function BlockEditor({
  name,
  control,
  blockTypes,
  locked,
}: BlockEditorProps) {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: name as never,
  });

  const watchedFields = useWatch({
    control,
    name: name,
  }) as Block[] | undefined;

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
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      move(oldIndex, newIndex);
    }
  };

  const addBlock = (blockType: BlockType) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type: blockType.type,
    };

    // Initialize fields with empty values
    blockType.fields?.forEach((field) => {
      newBlock[field.name] = "";
    });

    append(newBlock);
  };

  return (
    <div className="space-y-4">
      <div>
        {fields.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {fields.map((block, index) => {
                // Merge the stable ID from useFieldArray with the reactive value from useWatch
                const blockData = {
                  ...block,
                  ...(watchedFields?.[index] || {}),
                } as unknown as Block;

                const blockType = blockTypes.find(
                  (bt) => bt.type === blockData.type,
                );

                if (!blockType) return null;

                return (
                  <SortableBlock
                    key={block.id}
                    block={blockData}
                    blockType={blockType}
                    onRemove={locked ? undefined : () => remove(index)}
                    control={control}
                    blockIndex={index}
                    blockFieldName={name}
                    locked={locked}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        )}

        {fields.length === 0 && (
          <div className="text-center py-12 bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-muted-foreground mb-4">
              {ui.blockEditor.noBlocks}
            </p>
          </div>
        )}
      </div>

      {!locked && (
        <div className="flex flex-wrap gap-2">
          {blockTypes.map((blockType) => (
            <Button
              key={blockType.type}
              type="button"
              onClick={() => addBlock(blockType)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {ui.blockEditor.add} {blockType.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
