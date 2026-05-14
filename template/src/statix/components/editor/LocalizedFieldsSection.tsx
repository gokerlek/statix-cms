"use client";

import { useMemo } from "react";
import { Control, useWatch } from "react-hook-form";

import { DirtyFieldIndicator } from "@/statix/components/editor/DirtyFieldIndicator";
import { FieldRenderer } from "@/statix/components/editor/FieldRenderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/statix/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/statix/components/ui/tabs";
import ui from "@/statix/content/ui.json";
import { deepEqual, getByPath } from "@/statix/lib/field-diff";
import { cn } from "@/statix/lib/utils";
import { Field } from "@/statix/types/cms";
import { ContentFormValues } from "@/statix/types/content";

interface LocalizedFieldsSectionProps {
  fields: Field[];
  control: Control<ContentFormValues>;
  locales: string[];
  defaultLocale: string;
  /**
   * Which locale tab to open by default. Comes from the `?locale=` URL
   * param (dashboard deep-link) falling back to `defaultLocale`.
   */
  activeLocale?: string;
  snapshot?: ContentFormValues | null;
  onRevertField?: (name: string) => void;
}

export function LocalizedFieldsSection({
  fields,
  control,
  locales,
  defaultLocale,
  activeLocale,
  snapshot = null,
  onRevertField,
}: LocalizedFieldsSectionProps) {
  // Subscribe to the whole `translations` subtree once. Diffing happens
  // per-locale inside the memo — no extra hook per tab, so the rule of
  // hooks stays intact.
  const currentTranslations = useWatch({ control, name: "translations" });

  const dirtyLocales = useMemo(() => {
    const set = new Set<string>();
    if (!snapshot) return set;
    const snapshotTranslations = getByPath(snapshot, "translations") as
      | Record<string, unknown>
      | undefined;
    for (const locale of locales) {
      const a =
        (currentTranslations as Record<string, unknown> | undefined)?.[locale];
      const b = snapshotTranslations?.[locale];
      if (!deepEqual(a, b)) set.add(locale);
    }
    return set;
  }, [currentTranslations, snapshot, locales]);

  if (fields.length === 0) return null;

  const initialLocale =
    activeLocale && locales.includes(activeLocale) ? activeLocale : defaultLocale;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.collectionPage.localizedContent}</CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue={initialLocale} className="w-full">
          <TabsList className="mb-6 w-fit">
            {locales.map((locale) => {
              const isDirty = dirtyLocales.has(locale);
              return (
                <TabsTrigger
                  key={locale}
                  value={locale}
                  className="uppercase min-w-[100px] gap-2"
                  aria-label={
                    isDirty
                      ? `${locale.toUpperCase()} — ${ui.fieldIndicator.modified}`
                      : locale.toUpperCase()
                  }
                >
                  {locale}
                  {isDirty && (
                    <span
                      aria-hidden
                      className={cn(
                        "inline-block size-1.5 rounded-full bg-amber-500",
                      )}
                    />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {locales.map((locale) => (
            <TabsContent
              key={locale}
              value={locale}
              className="space-y-6 mt-0 data-[state=inactive]:hidden"
            >
              {fields.map((field) => {
                const name = `translations.${locale}.${field.name}`;
                return (
                  <DirtyFieldIndicator
                    key={`${locale}.${field.name}`}
                    name={name}
                    control={control}
                    snapshot={snapshot}
                    fieldType={field.type}
                    fieldLabel={`${field.label} · ${locale.toUpperCase()}`}
                    onRevert={onRevertField}
                  >
                    <FieldRenderer
                      field={field}
                      control={control}
                      name={name}
                      structureLocked={locale !== defaultLocale}
                      ignoreRequired={locale !== defaultLocale}
                    />
                  </DirtyFieldIndicator>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
