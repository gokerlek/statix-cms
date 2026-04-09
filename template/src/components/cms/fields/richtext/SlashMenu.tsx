"use client";

import { canUseRegexLookbehind } from "prosekit/core";
import { useEditor } from "prosekit/react";
import {
  AutocompleteEmpty,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopover,
} from "prosekit/react/autocomplete";

// "/" ile başlayan, boşlukla başlamayan girişleri yakala
const regex = canUseRegexLookbehind()
  ? /(?<!\S)\/(\S.*)?$/u
  : /\/(\S.*)?$/u;

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
        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.setParagraph?.()}
        >
          <span>Metin</span>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.setHeading?.({ level: 1 })}
        >
          <span>Başlık 1</span>
          <kbd className="font-mono text-xs text-muted-foreground">#</kbd>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.setHeading?.({ level: 2 })}
        >
          <span>Başlık 2</span>
          <kbd className="font-mono text-xs text-muted-foreground">##</kbd>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.setHeading?.({ level: 3 })}
        >
          <span>Başlık 3</span>
          <kbd className="font-mono text-xs text-muted-foreground">###</kbd>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.wrapInList?.({ kind: "bullet" })}
        >
          <span>Madde İşaretli Liste</span>
          <kbd className="font-mono text-xs text-muted-foreground">-</kbd>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.wrapInList?.({ kind: "ordered" })}
        >
          <span>Numaralı Liste</span>
          <kbd className="font-mono text-xs text-muted-foreground">1.</kbd>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.setBlockquote?.()}
        >
          <span>Alıntı</span>
          <kbd className="font-mono text-xs text-muted-foreground">&gt;</kbd>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.insertHorizontalRule?.()}
        >
          <span>Yatay Çizgi</span>
          <kbd className="font-mono text-xs text-muted-foreground">---</kbd>
        </AutocompleteItem>

        <AutocompleteItem
          className={itemClass}
          onSelect={() => cmds.setCodeBlock?.()}
        >
          <span>Kod Bloğu</span>
          <kbd className="font-mono text-xs text-muted-foreground">```</kbd>
        </AutocompleteItem>

        <AutocompleteEmpty className={itemClass}>
          <span>Sonuç bulunamadı</span>
        </AutocompleteEmpty>
      </AutocompleteList>
    </AutocompletePopover>
  );
}
