"use client";

import { Block, BlockType } from "@/types/cms";

import { BlockImageField } from "./BlockImageField";
import { BlockTextareaField } from "./BlockTextareaField";
import { BlockTextField } from "./BlockTextField";

interface BlockFieldRendererProps {
  block: Block;
  blockType: BlockType;
  onUpdate: (field: string, value: unknown) => void;
}

export function BlockFieldRenderer({
  block,
  blockType,
  onUpdate,
}: BlockFieldRendererProps) {
  return (
    <div className="space-y-3">
      {blockType.fields?.map((field) => {
        const fieldValue = (block[field.name] as string) || "";

        if (field.type === "textarea") {
          return (
            <BlockTextareaField
              key={`${block.id}-${field.name}`}
              field={field}
              value={fieldValue}
              onUpdate={(val) => onUpdate(field.name, val)}
            />
          );
        }

        if (field.type === "image") {
          return (
            <BlockImageField
              key={`${block.id}-${field.name}`}
              field={field}
              value={fieldValue}
              onUpdate={(val) => onUpdate(field.name, val)}
            />
          );
        }

        // Default: text input
        return (
          <BlockTextField
            key={`${block.id}-${field.name}`}
            field={field}
            value={fieldValue}
            onUpdate={(val) => onUpdate(field.name, val)}
          />
        );
      })}
    </div>
  );
}
