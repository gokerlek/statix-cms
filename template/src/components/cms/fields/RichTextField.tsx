"use client";

import { useEffect } from "react";
import { Control, Controller } from "react-hook-form";

import { EditorContent, useEditor } from "@tiptap/react";

import { Label } from "@/components/ui/label";
import { RichTextField as RichTextFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

import { getEditorExtensions } from "./richtext/editorConfig";
import { RichTextToolbar } from "./richtext/RichTextToolbar";

interface RichTextFieldProps {
  field: RichTextFieldType;
  control: Control<ContentFormValues>;
  name: string;
  variant?: "normal" | "block" | "compact";
}

// Direct props for non-Controller usage
interface DirectRichTextFieldProps {
  field: RichTextFieldType;
  value: string;
  onChange: (value: string) => void;
  variant?: "normal" | "block" | "compact";
  error?: boolean;
}

const defaultToolbar = [
  "bold",
  "italic",
  "underline",
  "link",
  "fontSize",
  "textAlign",
  "bulletList",
  "orderedList",
  "blockquote",
] as const;

// Controller-based RichTextField (for normal fields)
export function RichTextField({
  field,
  control,
  name,
  variant = "normal",
}: RichTextFieldProps) {
  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={{ required: field.required }}
        render={({ field: formField, fieldState }) => (
          <RichTextEditor
            field={field}
            value={formField.value as string}
            onChange={formField.onChange}
            variant={variant}
            error={!!fieldState.error}
          />
        )}
      />
    </div>
  );
}

// Direct RichTextField (for block/list usage)
export function DirectRichTextField({
  field,
  value,
  onChange,
  variant = "normal",
  error,
}: DirectRichTextFieldProps) {
  return (
    <RichTextEditor
      field={field}
      value={value}
      onChange={onChange}
      variant={variant}
      error={error}
    />
  );
}

interface RichTextEditorProps {
  field: RichTextFieldType;
  value: string;
  onChange: (content: string) => void;
  variant: "normal" | "block" | "compact";
  error?: boolean;
}

function RichTextEditor({
  field,
  value,
  onChange,
  variant,
  error,
}: RichTextEditorProps) {
  const toolbar = field.toolbar || defaultToolbar;
  const placeholder = field.placeholder;

  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none ${
          variant === "compact"
            ? "min-h-[60px] p-2"
            : variant === "block"
              ? "min-h-[80px] p-3"
              : "min-h-[120px] p-3"
        } ${error ? "border-destructive" : ""}`,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const getContainerClass = () => {
    const baseClass = "border rounded-md";
    const errorClass = error ? "border-destructive" : "border-border";

    return `${baseClass} ${errorClass}`;
  };

  return (
    <div className={variant !== "normal" ? "space-y-2" : ""}>
      {variant === "block" && (
        <Label className="text-sm font-medium">{field.label}</Label>
      )}
      {variant === "compact" && (
        <Label className="text-xs font-medium text-muted-foreground uppercase">
          {field.label}
        </Label>
      )}

      <div className={getContainerClass()}>
        <RichTextToolbar editor={editor} toolbar={toolbar} variant={variant} />

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className={
            variant === "compact"
              ? "min-h-[60px]"
              : variant === "block"
                ? "min-h-[80px]"
                : "min-h-[120px]"
          }
        />
      </div>
    </div>
  );
}
