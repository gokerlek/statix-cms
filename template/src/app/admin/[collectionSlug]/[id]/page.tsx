"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { EditorHeader } from "@/components/cms/editor/EditorHeader";
import { LocalizedFieldsSection } from "@/components/cms/editor/LocalizedFieldsSection";
import { SharedFieldsSection } from "@/components/cms/editor/SharedFieldsSection";
import { PageTitleUpdater } from "@/components/cms/PageTitleUpdater";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/loading";
import ui from "@/content/ui.json";
import { useContent } from "@/hooks/use-content";
import { useEditorForm } from "@/hooks/use-editor-form";
import { ROUTES } from "@/lib/constants";
import { resolveContentTitle } from "@/lib/content-utils";
import { statixConfig } from "@/statix.config";
import { ContentFormValues } from "@/types/content";

interface EditorPageProps {
  params: Promise<{ collectionSlug: string; id: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const router = useRouter();
  const [collectionSlug, setCollectionSlug] = useState("");
  const [id, setId] = useState("");

  // Unwrap params
  useEffect(() => {
    params.then((p) => {
      setCollectionSlug(p.collectionSlug);
      setId(p.id);
    });
  }, [params]);

  const collection = useMemo(
    () => statixConfig.collections.find((c) => c.slug === collectionSlug),
    [collectionSlug],
  );

  const isNew = id === "new";

  // React Query Hook
  const { content, isLoading, saveContent, isSaving } = useContent({
    collectionSlug,
    id: id || undefined,
  });

  // Form Logic Hook

  const {
    control,
    handleSubmit,
    formState,
    discardChanges,
    sharedFields,
    localizedFields,
    locales,
    defaultLocale,
    clearLocalData,
  } = useEditorForm({
    collection,
    id,
    content,
    isNew,
  });

  const onSubmit = async (data: ContentFormValues) => {
    try {
      await saveContent(data);

      clearLocalData();

      if (isNew) {
        // After creating new item, go back to collection list
        router.push(ROUTES.ADMIN.COLLECTION(collectionSlug));
        toast.success(ui.toasts.success.created);
      } else {
        toast.success(ui.toasts.success.saved);
      }
    } catch {
      // Error handling is done in the hook
    }
  };

  // Show loading while params are being resolved or content is loading
  if (!collectionSlug || (isLoading && !isNew)) {
    return (
      <div className="container mx-auto py-10">
        <PageLoading />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10 text-center">
            <h1 className="text-2xl font-bold">
              {ui.common.collectionNotFound}
            </h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form className="space-y-8">
      <PageTitleUpdater title={resolveContentTitle(collection, content)} />

      <EditorHeader
        collectionSlug={collectionSlug}
        collectionLabel={collection.label}
        isNew={isNew}
        isSaving={isSaving}
        onSave={handleSubmit(onSubmit)}
        onDiscard={discardChanges}
        control={control}
        isSingleton={collection.type === "singleton"}
        id={id}
        isDirty={formState.isDirty}
      />

      <SharedFieldsSection fields={sharedFields} control={control} />

      <LocalizedFieldsSection
        fields={localizedFields}
        control={control}
        locales={locales}
        defaultLocale={defaultLocale}
      />
    </form>
  );
}
