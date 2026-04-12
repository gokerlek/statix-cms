"use client";

import { useState } from "react";

import { isMarkActive } from "prosekit/core";
import { useEditor } from "prosekit/react";
import { InlinePopover } from "prosekit/react/inline-popover";
import { IconLink } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ui from "@/content/ui.json";

import { TOOLBAR_ITEMS } from "./toolbar-items";

const INLINE_KEYS = ["bold", "italic", "underline", "strike", "code"];

export function RichTextInlineMenu() {
  const editor = useEditor({ update: true });
  const [linkMenuOpen, setLinkMenuOpen] = useState(false);

  if (!editor.mounted) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = editor.commands as any;
  const state = editor.view.state;
  const markActive = (name: string) => isMarkActive(state, name);

  // expected: editor state guard
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

  const getLinkHref = () => {
    try {
      const { $from } = state.selection;
      const linkMark = state.schema.marks["link"];
      const mark = linkMark?.isInSet(state.storedMarks || $from.marks());
      return mark ? (mark.attrs.href as string) ?? "" : "";
    } catch {
      return "";
    }
  };

  const activeCtx = { markActive, nodeActive };
  const inlineItems = TOOLBAR_ITEMS.filter((item) =>
    INLINE_KEYS.includes(item.key),
  );

  return (
    <>
      <InlinePopover
        className="z-50 flex min-w-32 items-center space-x-0.5 overflow-auto whitespace-nowrap rounded-md border border-border bg-background p-1 shadow-md [&:not([data-state])]:hidden"
        onOpenChange={(open) => {
          if (!open) setLinkMenuOpen(false);
        }}
      >
        {inlineItems.map((item) => (
          <Button
            key={item.key}
            type="button"
            variant={item.isActive?.(activeCtx) ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => item.action(cmds)}
            onMouseDown={(e) => e.preventDefault()}
            title={item.title}
          >
            <item.icon size={16} />
          </Button>
        ))}

        <Button
          type="button"
          variant={markActive("link") ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            cmds.expandLink?.();
            setLinkMenuOpen((o) => !o);
          }}
          onMouseDown={(e) => e.preventDefault()}
          title={ui.richTextToolbar.link}
        >
          <IconLink size={16} />
        </Button>
      </InlinePopover>

      <InlinePopover
        placement="bottom"
        defaultOpen={false}
        open={linkMenuOpen}
        onOpenChange={setLinkMenuOpen}
        className="z-50 flex w-72 flex-col items-stretch gap-y-2 rounded-lg border border-border bg-background p-4 shadow-md [&:not([data-state])]:hidden"
      >
        {linkMenuOpen && (
          <Input
            placeholder={ui.richTextToolbar.linkPopover.placeholder}
            defaultValue={getLinkHref()}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const href = (e.target as HTMLInputElement).value.trim();
                if (href) {
                  cmds.addLink?.({ href });
                } else {
                  cmds.removeLink?.();
                }
                setLinkMenuOpen(false);
                editor.focus();
              }
              if (e.key === "Escape") {
                setLinkMenuOpen(false);
                editor.focus();
              }
            }}
          />
        )}
        {markActive("link") && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              cmds.removeLink?.();
              setLinkMenuOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {ui.richTextToolbar.linkPopover.removeLink}
          </Button>
        )}
      </InlinePopover>
    </>
  );
}
