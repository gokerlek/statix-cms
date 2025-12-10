export type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "file"
  | "number"
  | "select"
  | "blocks"
  | "date"
  | "checkbox"
  | "switch"
  | "list";

export interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  localized?: boolean;
}

export interface TextField extends BaseField {
  type: "text";
  placeholder?: string;
}

export interface TextareaField extends BaseField {
  type: "textarea";
  placeholder?: string;
  rows?: number;
}

export interface ImageField extends BaseField {
  type: "image";
}

export interface FileField extends BaseField {
  type: "file";
  accept?: string[]; // e.g., [".pdf", ".doc", ".docx"]
  maxSize?: number; // in bytes
}

export interface NumberField extends BaseField {
  type: "number";
  min?: number;
  max?: number;
}

export interface SelectField extends BaseField {
  type: "select";
  options: { label: string; value: string }[];
}

export interface DateField extends BaseField {
  type: "date";
}

export interface BlockType {
  type: string;
  label: string;
  fields?: Field[];
}

export interface BlocksField extends BaseField {
  type: "blocks";
  blocks: BlockType[];
}

export interface ListField extends BaseField {
  type: "list";
  fields: Field[]; // Fields for each list item
}

export interface CheckboxField extends BaseField {
  type: "checkbox";
  defaultChecked?: boolean;
}

export interface SwitchField extends BaseField {
  type: "switch";
  defaultChecked?: boolean;
}

export type Field =
  | TextField
  | TextareaField
  | ImageField
  | FileField
  | NumberField
  | SelectField
  | DateField
  | CheckboxField
  | SwitchField
  | BlocksField
  | ListField;

export interface Collection {
  slug: string;
  label: string;
  type?: "collection" | "singleton"; // default: 'collection'
  path: string; // folder path in repo (e.g., 'content/blog')
  fields: Field[];
  identifierField?: string; // which field to use as filename (default: 'slug')
  titleField?: string; // which field to use as the display title in lists (default: 'title' or 'slug')
  icon?: string; // Lucide icon name or SVG path
}

export interface StatixConfig {
  github: {
    owner: string;
    repo: string;
    branch: string;
  };
  mediaFolder: string; // e.g., 'public/uploads'
  maxUploadSize?: number; // in bytes, default: 5MB (5 * 1024 * 1024)
  i18n?: {
    locales: string[];
    defaultLocale: string;
  };
  collections: Collection[];
}

// Block data structure
export interface Block {
  id: string;
  type: string;
  [key: string]: unknown; // dynamic fields based on block type
}
