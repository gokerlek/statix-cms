"use client";

import { canUseRegexLookbehind } from "prosekit/core";
import { useEditor } from "prosekit/react";
import {
  AutocompleteEmpty,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopover,
} from "prosekit/react/autocomplete";

import ui from "@/content/ui.json";

const regex = canUseRegexLookbehind()
  ? /(?<!\S)\/(\S.*)?$/u
  : /\/(\S.*)?$/u;

const t = ui.richTextToolbar.slashMenu;

const SLASH_ITEMS = [
  { label: t.paragraph, shortcut: "", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.setParagraph?.() },
  { label: t.heading1, shortcut: "#", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.setHeading?.({ level: 1 }) },
  { label: t.heading2, shortcut: "##", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.setHeading?.({ level: 2 }) },
  { label: t.heading3, shortcut: "###", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.setHeading?.({ level: 3 }) },
  { label: t.bulletList, shortcut: "-", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.wrapInList?.({ kind: "bullet" }) },
  { label: t.orderedList, shortcut: "1.", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.wrapInList?.({ kind: "ordered" }) },
  { label: t.blockquote, shortcut: ">", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.setBlockquote?.() },
  { label: t.horizontalRule, shortcut: "---", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.insertHorizontalRule?.() },
  { label: t.codeBlock, shortcut: "```", action: (c: Record<string, ((...a: unknown[]) => void) | undefined>) => c.setCodeBlock?.() },
];

const itemClass =
  "relative flex cursor-default select-none items-center justify-between scroll-my-1 rounded-sm px-3 py-1.5 text-sm outline-none data-focused:bg-accent data-focused:text-accent-foreground";

export function RichTextSlashMenu() {
  const editor = useEditor();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = editor.commands as any;

  return (
    <AutocompletePopover
      regex={regex}
      className="z-50 relative block max-h-96 min-w-60 select-none overflow-auto whitespace-nowrap rounded-lg border border-border bg-background p-1 shadow-md [&:not([data-state])]:hidden"
    >
      <AutocompleteList>
        {SLASH_ITEMS.map((item) => (
          <AutocompleteItem
            key={item.label}
            className={itemClass}
            onSelect={() => item.action(cmds)}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <kbd className="font-mono text-xs text-muted-foreground">
                {item.shortcut}
              </kbd>
            )}
          </AutocompleteItem>
        ))}

        <AutocompleteEmpty className={itemClass}>
          <span>{t.noResults}</span>
        </AutocompleteEmpty>
      </AutocompleteList>
    </AutocompletePopover>
  );
}
