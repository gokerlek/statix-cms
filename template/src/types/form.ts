/**
 * Form-related types for react-hook-form and dnd-kit integration
 */

import { Control, FieldValues } from "react-hook-form";

import { ContentFormValues } from "./content";

/**
 * CMS Form Control type - generic alias for react-hook-form Control
 * Using FieldValues to allow flexibility with dynamic field structures
 */
export type CMSFormControl = Control<ContentFormValues>;

/**
 * dnd-kit drag attributes interface
 * Based on @dnd-kit/core useSortable attributes
 */
export interface DragAttributes {
  role: string;
  tabIndex: number;
  "aria-pressed": boolean | undefined;
  "aria-roledescription": string;
  "aria-describedby": string;
}

/**
 * Generic form field control props
 * Used by field components that receive react-hook-form control
 */
export interface FormFieldControlProps<
  T extends FieldValues = ContentFormValues,
> {
  control: Control<T>;
  name: string;
}
