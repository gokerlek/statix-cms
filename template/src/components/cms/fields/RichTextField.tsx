"use client";

import { useCallback, useEffect, useMemo } from "react";
import { Control, Controller } from "react-hook-form";

import { createEditor } from "prosekit/core";
import { ProseKit, useDocChange, useEditor } from "prosekit/react";
import "prosekit/basic/style.css";
import "prosekit/extensions/list/style.css";

import { Label } from "@/components/ui/label";
import { RichTextField as RichTextFieldType } from "@/types/cms";
import { ContentFormValues } from "@/types/content";

import { defineEditorExtension } from "./richtext/editorConfig";
import { RichTextToolbar } from "./richtext/RichTextToolbar";
import { RichTextInlineMenu } from "./richtext/InlineMenu";
import { RichTextSlashMenu } from "./richtext/SlashMenu";
import { RichTextBlockHandle } from "./richtext/BlockHandle";
import { DropIndicator } from "prosekit/react/drop-indicator";

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
  "undo",
  "redo",
  "heading1",
  "heading2",
  "heading3",
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
  "fontSize",
  "textAlign",
  "bulletList",
  "orderedList",
  "blockquote",
  "codeBlock",
  "horizontalRule",
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

  const editor = useMemo(
    () =>
      createEditor({
        extension: defineEditorExtension(),
        defaultContent: value || "<p></p>",
      }),
    // Only create editor once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Sync external value changes into editor
  useEffect(() => {
    if (!editor.mounted) return;
    try {
      const current = editor.getDocHTML();
      if (value !== current) {
        editor.setContent(value || "");
      }
    } catch {
      // ignore
    }
  }, [value, editor]);

  // Callback ref for mounting/unmounting
  const mountRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        editor.mount(node);
      } else {
        editor.unmount();
      }
    },
    [editor],
  );

  const containerClass = `border rounded-md ${error ? "border-destructive" : "border-border"}`;

  // pl-10 (40px) block handle için sol alan bırakır
  const editorClass = [
    "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
    variant === "compact"
      ? "min-h-[60px] pl-10 pr-3 py-2"
      : variant === "block"
        ? "min-h-[80px] pl-10 pr-3 py-3"
        : "min-h-[120px] pl-10 pr-3 py-3",
  ].join(" ");

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

      <ProseKit editor={editor}>
        <div className={containerClass}>
          <RichTextToolbar toolbar={toolbar} variant={variant} />
          <div className="relative">
            <div ref={mountRef} className={editorClass} />
            <RichTextInlineMenu />
            <RichTextSlashMenu />
            <RichTextBlockHandle />
            <DropIndicator className="z-50 h-0.5 bg-blue-500 transition-all" />
          </div>
          <EditorUpdateHandler onChange={onChange} />
        </div>
      </ProseKit>
    </div>
  );
}

// Listens to doc changes inside ProseKit context and fires onChange
function EditorUpdateHandler({
  onChange,
}: {
  onChange: (value: string) => void;
}) {
  const editor = useEditor();

  useDocChange(() => {
    try {
      onChange(editor.getDocHTML());
    } catch {
      // ignore
    }
  });

  return null;
}
