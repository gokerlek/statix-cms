/**
 * Content data types for CMS content management
 */

export type ContentStatus = "draft" | "published" | "archived";

/**
 * Translations structure: { locale: { fieldName: value } }
 */
export interface ContentTranslations {
  [locale: string]: Record<string, unknown>;
}

/**
 * Base content data structure from JSON files
 */
export interface ContentData {
  status?: ContentStatus;
  translations?: ContentTranslations;
  [key: string]: unknown;
}

/**
 * Form values used by react-hook-form
 * Inherits from ContentData with additional form-specific handling
 */
export type ContentFormValues = ContentData;
