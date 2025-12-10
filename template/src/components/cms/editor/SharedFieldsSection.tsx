import { Control } from "react-hook-form";

import { FieldRenderer } from "@/components/cms/FieldRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ui from "@/content/ui.json";
import { Field } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface SharedFieldsSectionProps {
  fields: Field[];
  control: Control<ContentFormValues>;
}

export function SharedFieldsSection({
  fields,
  control,
}: SharedFieldsSectionProps) {
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.collectionPage.sharedFields}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {fields.map((field) => (
          <FieldRenderer key={field.name} field={field} control={control} />
        ))}
      </CardContent>
    </Card>
  );
}
