import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { toast } from "sonner";

import ui from "@/content/ui.json";
import { statixConfig } from "@/statix.config";
import { useUnsavedStore } from "@/stores/useUnsavedStore";
import { Collection } from "@/types/cms";
import { ContentData, ContentFormValues } from "@/types/content";

// Simple deep equality check for JSON-compatible objects
function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }

  const record1 = obj1 as Record<string, unknown>;
  const record2 = obj2 as Record<string, unknown>;
  const keys1 = Object.keys(record1);
  const keys2 = Object.keys(record2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(record1[key], record2[key])) {
      return false;
    }
  }

  return true;
}

interface UseEditorFormOptions {
  collection: Collection | undefined;
  id: string;
  content: ContentData | null;
  isNew: boolean;
}

export function useEditorForm({
  collection,
  id,
  content,
  isNew,
}: UseEditorFormOptions) {
  const {
    control,
    handleSubmit,
    reset,
    formState,
    watch,
    setValue,
    getValues,
  } = useForm<ContentFormValues>({
    defaultValues: {
      status: "draft",
    },
  });

  const addChange = useUnsavedStore((state) => state.addChange);
  const removeChange = useUnsavedStore((state) => state.removeChange);

  // Separate fields into shared and localized
  const sharedFields = useMemo(
    () =>
      collection?.fields.filter(
        (f) => !f.localized && f.name !== "status" // Exclude status from shared fields
      ) || [],
    [collection]
  );
  const localizedFields = useMemo(
    () => collection?.fields.filter((f) => f.localized) || [],
    [collection]
  );
  const locales = useMemo(() => statixConfig.i18n?.locales || ["en"], []);
  const defaultLocale = useMemo(
    () => statixConfig.i18n?.defaultLocale || "en",
    []
  );

  // Helper to generate default values from content or skeleton
  const getDefaultValues = useCallback(() => {
    if (isNew) {
      // Initialize with empty values
      const defaultValues: ContentFormValues = {} as ContentFormValues;

      // Initialize shared fields
      sharedFields.forEach((field) => {
        if (field.type === "blocks") {
          defaultValues[field.name] = [];
        } else if (field.type === "date") {
          defaultValues[field.name] = new Date().toISOString().split("T")[0];
        } else {
          defaultValues[field.name] = "";
        }
      });

      // Initialize status
      defaultValues.status = "draft";

      // Initialize localized fields
      defaultValues.translations = {};
      locales.forEach((locale) => {
        defaultValues.translations![locale] = {};
        localizedFields.forEach((field) => {
          if (field.type === "blocks") {
            defaultValues.translations![locale][field.name] = [];
          } else {
            defaultValues.translations![locale][field.name] = "";
          }
        });
      });

      return defaultValues;
    } else if (content) {
      // Load existing data
      const data = { ...content };

      // Ensure all shared fields have a value
      sharedFields.forEach((field) => {
        if (data[field.name] === undefined || data[field.name] === null) {
          if (field.type === "blocks") {
            data[field.name] = [];
          } else if (field.type === "date") {
            data[field.name] = new Date().toISOString().split("T")[0];
          } else {
            data[field.name] = "";
          }
        }
      });

      // Ensure status has a value
      if (!data.status) {
        data.status = "published"; // Default for existing content
      }

      if (!data.translations && localizedFields.length > 0) {
        // Migration for legacy data
        data.translations = { [defaultLocale]: {} };
        localizedFields.forEach((field) => {
          if (data[field.name] !== undefined) {
            data.translations![defaultLocale][field.name] = data[field.name];
          }
        });
        locales
          .filter((l) => l !== defaultLocale)
          .forEach((l) => {
            data.translations![l] = {};
          });
      }

      // Ensure all localized fields have a value
      if (data.translations) {
        locales.forEach((locale) => {
          if (!data.translations![locale]) {
            data.translations![locale] = {};
          }

          localizedFields.forEach((field) => {
            if (
              data.translations![locale][field.name] === undefined ||
              data.translations![locale][field.name] === null
            ) {
              if (field.type === "blocks") {
                data.translations![locale][field.name] = [];
              } else {
                data.translations![locale][field.name] = "";
              }
            } else if (field.type === "list") {
              // Ensure legacy list items have IDs
              const list = data.translations![locale][field.name] as any[];

              if (Array.isArray(list)) {
                list.forEach((item) => {
                  if (!item.id) {
                    item.id = crypto.randomUUID();
                  }
                });
              }
            }
          });
        });
      }

      return data;
    }

    return null;
  }, [isNew, content, sharedFields, localizedFields, locales, defaultLocale]);

  // Initialize form data
  useEffect(() => {
    if (!collection || !id) return;

    const currentServerValues = getDefaultValues();

    // Use reset to initialize form with server values first
    // This sets the "clean" state of the form
    if (currentServerValues) {
      reset(currentServerValues);
    }

    // Check for local unsaved changes
    const localKey = `unsaved-content-${collection.slug}-${id}`;
    const localDataString = localStorage.getItem(localKey);

    if (localDataString) {
      try {
        const localData = JSON.parse(localDataString);

        if (Object.keys(localData).length > 0) {
          // Compare local data with the server values we just generated
          if (
            currentServerValues &&
            JSON.stringify(currentServerValues) === JSON.stringify(localData)
          ) {
            // Identical to server, so it's not really unsaved
            localStorage.removeItem(localKey);
            removeChange(collection.slug, id);
          } else {
            // It is different, so restore it
            // We reset AGAIN with local data.
            // Note: react-hook-form might treat this as new default values, making it "pristine" locally
            // but visually it will show the restored data.
            // To make it appear "dirty" (so save button works), we might need to setValue or keep it pristine but warn.
            // Standard behavior: Resetting with data makes it "pristine" based on THAT data.
            // But we want the user to know it's "unsaved".
            // The visual badge "Unsaved (Local)" handles the warning.
            // The save button enabled/disabled state depends on isDirty.
            // If we restore local data, formState.isDirty will be false (because we reset to it).
            // BUT, we want to allow saving.
            // Actually, if we reset to localData, we are saying "This is the starting point".
            // The user can edit from there.
            // If they click "Save", they save localData to server.
            // Wait, if isDirty is false, maybe "Save" is disabled?
            // In EditorHeader, disabled={isSaving}. It does NOT check isDirty. So save is always enabled. Good.
            reset(localData, { keepDefaultValues: true });
            toast.info(ui.common.restoredMessage);
          }
        }
      } catch (e) {
        console.error("Failed to parse local unsaved data", e);
      }
    }
  }, [
    collection,
    id,
    getDefaultValues, // specific dependency
    reset,
    removeChange, // included
  ]);

  const clearLocalData = useCallback(() => {
    if (!collection || !id) return;

    const localKey = `unsaved-content-${collection.slug}-${id}`;

    localStorage.removeItem(localKey);
    removeChange(collection.slug, id);
  }, [collection, id, removeChange]);

  // Auto-save changes
  useEffect(() => {
    if (!collection || !id) return;

    const subscription = watch((value, { name }) => {
      // Ignore system resets (where name is undefined) to prevent race conditions
      if (!name) return;

      const serverValues = getDefaultValues();

      // Compare current form value with server defaults
      if (serverValues && deepEqual(value, serverValues)) {
        // Form matches server data -> Clear local unsaved data
        const localKey = `unsaved-content-${collection.slug}-${id}`;

        if (localStorage.getItem(localKey)) {
          clearLocalData();
        }

        return;
      }

      // If different, save local data
      const localKey = `unsaved-content-${collection.slug}-${id}`;

      localStorage.setItem(localKey, JSON.stringify(value));

      // Determine display title
      const titleField = collection.titleField || "title";
      let title = value[titleField];

      // Check localized fields if title not found at top level
      if (!title && value.translations) {
        const translations = value.translations as Record<
          string,
          Record<string, unknown>
        >;
        // Try default locale first, then any available locale
        const defaultLoc = statixConfig.i18n?.defaultLocale || "en";

        title = translations[defaultLoc]?.[titleField];

        if (!title) {
          // Try any available locale
          for (const locale of Object.keys(translations)) {
            if (translations[locale]?.[titleField]) {
              title = translations[locale][titleField];
              break;
            }
          }
        }
      }

      // Fallback for title
      if (!title && value.name) title = value.name;

      if (!title) title = id;

      addChange(collection.slug, id, String(title));
    });

    return () => subscription.unsubscribe();
  }, [watch, collection, id, addChange, getDefaultValues, clearLocalData]);

  // Sync validation and structure across locales
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Logic to sync structure from default locale to others
      if (!name || !name.startsWith(`translations.${defaultLocale}`)) return;

      const currentValues = getValues();
      const defaultTranslations = currentValues.translations?.[defaultLocale];

      if (!defaultTranslations) return;

      localizedFields.forEach((field) => {
        if (field.type !== "blocks" && field.type !== "list") return;

        const defaultArray = defaultTranslations[field.name];

        if (!Array.isArray(defaultArray)) return;

        locales.forEach((locale) => {
          if (locale === defaultLocale) return;

          const targetPath: any = `translations.${locale}.${field.name}`;
          const targetArray =
            (currentValues.translations?.[locale]?.[field.name] as any[]) || [];

          // Reconstruct target array based on default array structure (matching by ID)
          const newTargetArray = defaultArray.map((defaultItem: any) => {
            // If item has no ID, we can't reliably sync.
            // Blocks always have IDs. Lists should have IDs (we'll ensure this).
            if (!defaultItem.id) return defaultItem;

            const existingItem = targetArray.find(
              (t) => t.id === defaultItem.id
            );

            if (existingItem) return existingItem;

            // Create new item
            const newItem: any = { id: defaultItem.id };

            if (field.type === "blocks") {
              newItem.type = defaultItem.type;
              const blockType = field.blocks?.find(
                (b) => b.type === defaultItem.type
              );

              blockType?.fields?.forEach((f) => {
                newItem[f.name] = "";
              });
            } else {
              field.fields?.forEach((f) => {
                newItem[f.name] = "";
              });
            }

            return newItem;
          });

          // Deep compare to avoid unnecessary updates
          if (JSON.stringify(newTargetArray) !== JSON.stringify(targetArray)) {
            setValue(targetPath, newTargetArray);
          }
        });
      });
    });

    return () => subscription.unsubscribe();
  }, [watch, defaultLocale, localizedFields, locales, setValue, getValues]);

  const discardChanges = useCallback(() => {
    const serverValues = getDefaultValues();

    if (serverValues) {
      reset(serverValues);
      clearLocalData();
      toast.info(ui.common.discardConfirmation);
    }
  }, [getDefaultValues, reset, clearLocalData]);

  return {
    control,
    handleSubmit,
    reset,
    formState,
    clearLocalData,
    discardChanges,

    sharedFields,
    localizedFields,
    locales,
    defaultLocale,
  };
}
