"use client";

import { isMarkActive } from "prosekit/core";
import { useEditor } from "prosekit/react";
import { IconLetterT } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";

import { LinkPopover } from "./LinkPopover";
import { ALIGN_ITEMS, TOOLBAR_ITEMS, type ToolbarItem } from "./toolbar-items";

export interface RichTextToolbarProps {
  toolbar: readonly string[];
  variant: "normal" | "block" | "compact";
  items?: ToolbarItem[];
}

export function RichTextToolbar({
  toolbar,
  variant,
  items = TOOLBAR_ITEMS,
}: RichTextToolbarProps) {
  const editor = useEditor({ update: true });

  // ---- Early return AFTER all hooks ----
  if (!editor.mounted) {
    return (
      <div
        className={
          variant === "compact"
            ? "border-b border-border p-1 h-8"
            : "border-b border-border p-2 h-10"
        }
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = editor.commands as any;
  const state = editor.view.state;
  const markActive = (markName: string) => isMarkActive(state, markName);

  // expected: editor state guard — ProseMirror throws on invalid selection state
  const nodeActive = (nodeName: string, attrs?: Record<string, unknown>) => {
    try {
      const { $from } = state.selection;
      let depth = $from.depth;
      while (depth >= 0) {
        const node = $from.node(depth);
        if (node.type.name === nodeName) {
          if (!attrs) return true;
          return Object.entries(attrs).every(([k, v]) => node.attrs[k] === v);
        }
        depth--;
      }
      return false;
    } catch {
      return false;
    }
  };

  // expected: editor state guard
  const currentAlign = (() => {
    try {
      return (state.selection.$from.node()?.attrs?.textAlign as string) ?? null;
    } catch {
      return null;
    }
  })();

  const isCompact = variant === "compact";
  const toolbarClass = isCompact
    ? "border-b border-border p-1 flex flex-wrap gap-0.5 items-center"
    : "border-b border-border p-2 flex flex-wrap gap-1 items-center";
  const btnSize = isCompact ? undefined : ("sm" as const);
  const btnClass = isCompact ? "h-7 w-7 p-0" : "";
  const iconSize = isCompact ? 14 : 16;
  const btnVariant = (on: boolean): "default" | "ghost" =>
    on ? "default" : "ghost";

  const activeCtx = { markActive, nodeActive };

  return (
    <div className={toolbarClass}>
      {items
        .filter((item) => toolbar.includes(item.key))
        .map((item) => (
          <Button
            key={item.key}
            type="button"
            variant={
              item.variant ?? btnVariant(item.isActive?.(activeCtx) ?? false)
            }
            size={btnSize}
            className={btnClass}
            onClick={() => item.action(cmds)}
            title={item.title}
          >
            <item.icon size={iconSize} />
          </Button>
        ))}

      {toolbar.includes("link") && (
        <LinkPopover
          btnSize={btnSize}
          btnClass={btnClass}
          iconSize={iconSize}
          btnVariant={btnVariant}
        />
      )}

      {toolbar.includes("fontSize") && (
        <Button
          type="button"
          variant={btnVariant(markActive("fontSize"))}
          size={btnSize}
          className={btnClass}
          onClick={() => {
            if (markActive("fontSize")) {
              cmds.unsetFontSize?.();
            } else {
              cmds.setFontSize?.("1.125rem");
            }
          }}
          title={ui.richTextToolbar.fontSize}
        >
          <IconLetterT size={iconSize} />
        </Button>
      )}

      {toolbar.includes("textAlign") &&
        ALIGN_ITEMS.map(({ align, Icon }) => (
          <Button
            key={align}
            type="button"
            variant={btnVariant(currentAlign === align)}
            size={btnSize}
            className={btnClass}
            onClick={() => cmds.setTextAlign?.(align)}
          >
            <Icon size={iconSize} />
          </Button>
        ))}
    </div>
  );
}
