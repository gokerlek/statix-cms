import { Control } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ButtonLoading } from "@/components/ui/loading";
import ui from "@/content/ui.json";
import { useUnsavedStore } from "@/stores/useUnsavedStore";
import { ContentFormValues } from "@/types/content";

import { StatusSelector } from "../StatusSelector";

interface EditorHeaderProps {
  collectionSlug: string;
  collectionLabel: string;
  isNew: boolean;
  isSaving: boolean;
  onSave: () => void;
  onDiscard?: () => void;
  control: Control<ContentFormValues>;
  isSingleton?: boolean;
  id: string;
  isDirty: boolean;
}

export function EditorHeader({
  collectionSlug,
  collectionLabel,
  isNew,
  isSaving,
  onSave,
  onDiscard,
  control,
  isSingleton,
  id,
  isDirty,
}: EditorHeaderProps) {
  const hasChange = useUnsavedStore.use.hasChange();

  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          {isSingleton
            ? collectionLabel
            : isNew
              ? `${ui.common.createNew} ${collectionLabel.replace(/s$/, "")}`
              : `${ui.common.edit} ${collectionLabel.replace(/s$/, "")}`}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <StatusSelector control={control} />

        {onDiscard && (
          <Button
            variant="outline"
            onClick={onDiscard}
            disabled={isSaving}
            type="button"
          >
            {ui.common.discard}
          </Button>
        )}

        <Button
          onClick={onSave}
          disabled={isSaving || (!isDirty && !hasChange(collectionSlug, id))}
        >
          {isSaving && <ButtonLoading className="mr-2" />}

          {isNew ? ui.common.create : ui.common.save}
        </Button>
      </div>
    </div>
  );
}
