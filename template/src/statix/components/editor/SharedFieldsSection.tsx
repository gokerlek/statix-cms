import { Control } from "react-hook-form";

import { DirtyFieldIndicator } from "@/statix/components/editor/DirtyFieldIndicator";
import { FieldRenderer } from "@/statix/components/editor/FieldRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";
import { Field } from "@/statix/types/cms";
import { ContentFormValues } from "@/statix/types/content";

interface SharedFieldsSectionProps {
  fields: Field[];
  control: Control<ContentFormValues>;
  snapshot?: ContentFormValues | null;
  onRevertField?: (name: string) => void;
}

export function SharedFieldsSection({
  fields,
  control,
  snapshot = null,
  onRevertField,
}: SharedFieldsSectionProps) {
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.collectionPage.sharedFields}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {fields.map((field) => (
          <DirtyFieldIndicator
            key={field.name}
            name={field.name}
            control={control}
            snapshot={snapshot}
            fieldType={field.type}
            fieldLabel={field.label}
            onRevert={onRevertField}
          >
            <FieldRenderer field={field} control={control} />
          </DirtyFieldIndicator>
        ))}
      </CardContent>
    </Card>
  );
}
