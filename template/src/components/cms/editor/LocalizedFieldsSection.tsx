import { Control } from "react-hook-form";

import { FieldRenderer } from "@/components/cms/FieldRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ui from "@/content/ui.json";
import { Field } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

interface LocalizedFieldsSectionProps {
  fields: Field[];
  control: Control<ContentFormValues>;
  locales: string[];
  defaultLocale: string;
}

export function LocalizedFieldsSection({
  fields,
  control,
  locales,
  defaultLocale,
}: LocalizedFieldsSectionProps) {
  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.collectionPage.localizedContent}</CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={defaultLocale} className="w-full">
          <TabsList className="mb-6">
            {locales.map((locale) => (
              <TabsTrigger
                key={locale}
                value={locale}
                className="uppercase min-w-[100px]"
              >
                {locale}
              </TabsTrigger>
            ))}
          </TabsList>

          {locales.map((locale) => (
            <TabsContent key={locale} value={locale} className="space-y-6 mt-0">
              {fields.map((field) => (
                <FieldRenderer
                  key={`${locale}.${field.name}`}
                  field={field}
                  control={control}
                  name={`translations.${locale}.${field.name}`}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
