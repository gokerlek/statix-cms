import { statixConfig } from "@/statix.config";
import { Collection } from "@/types/cms";
import { ContentData } from "@/types/content";

export function resolveContentTitle(
  collection: Collection,
  content: ContentData | null,
): string {
  const titleField = collection?.titleField || "title";
  const contentObj = content;

  // Check if field is specified as localized in config
  const fieldDef = collection?.fields.find((f) => f.name === titleField);
  const isLocalized = fieldDef?.localized;
  const defaultLocale = statixConfig.i18n?.defaultLocale || "en";

  // Resolve value
  let title = "";

  if (isLocalized && contentObj?.translations?.[defaultLocale]?.[titleField]) {
    title = String(contentObj.translations[defaultLocale][titleField]);
  } else {
    title = String(contentObj?.[titleField] || contentObj?.title || "");
  }

  return title;
}
