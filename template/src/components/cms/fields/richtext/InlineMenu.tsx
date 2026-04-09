"use client";

import { useState } from "react";

import { isMarkActive } from "prosekit/core";
import { useEditor } from "prosekit/react";
import { InlinePopover } from "prosekit/react/inline-popover";
import {
  IconBold,
  IconCode,
  IconItalic,
  IconLink,
  IconStrikethrough,
  IconUnderline,
} from "@tabler/icons-react";

export function RichTextInlineMenu() {
  const editor = useEditor({ update: true });
  const [linkMenuOpen, setLinkMenuOpen] = useState(false);

  if (!editor.mounted) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = editor.commands as any;
  const state = editor.view.state;
  const markActive = (name: string) => isMarkActive(state, name);

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

  const btnBase =
    "inline-flex items-center justify-center rounded-md p-1.5 text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground";

  return (
    <>
      <InlinePopover
        className="z-50 flex min-w-32 items-center space-x-0.5 overflow-auto whitespace-nowrap rounded-md border border-border bg-background p-1 shadow-md [&:not([data-state])]:hidden"
        onOpenChange={(open) => {
          if (!open) setLinkMenuOpen(false);
        }}
      >
        <button
          type="button"
          data-state={markActive("bold") ? "on" : "off"}
          onClick={() => cmds.toggleBold?.()}
          onMouseDown={(e) => e.preventDefault()}
          className={btnBase}
          title="Kalın"
        >
          <IconBold size={16} />
        </button>
        <button
          type="button"
          data-state={markActive("italic") ? "on" : "off"}
          onClick={() => cmds.toggleItalic?.()}
          onMouseDown={(e) => e.preventDefault()}
          className={btnBase}
          title="İtalik"
        >
          <IconItalic size={16} />
        </button>
        <button
          type="button"
          data-state={markActive("underline") ? "on" : "off"}
          onClick={() => cmds.toggleUnderline?.()}
          onMouseDown={(e) => e.preventDefault()}
          className={btnBase}
          title="Altı Çizili"
        >
          <IconUnderline size={16} />
        </button>
        <button
          type="button"
          data-state={markActive("strike") ? "on" : "off"}
          onClick={() => cmds.toggleStrike?.()}
          onMouseDown={(e) => e.preventDefault()}
          className={btnBase}
          title="Üstü Çizili"
        >
          <IconStrikethrough size={16} />
        </button>
        <button
          type="button"
          data-state={markActive("code") ? "on" : "off"}
          onClick={() => cmds.toggleCode?.()}
          onMouseDown={(e) => e.preventDefault()}
          className={btnBase}
          title="Kod"
        >
          <IconCode size={16} />
        </button>
        <button
          type="button"
          data-state={markActive("link") ? "on" : "off"}
          onClick={() => {
            cmds.expandLink?.();
            setLinkMenuOpen((o) => !o);
          }}
          onMouseDown={(e) => e.preventDefault()}
          className={btnBase}
          title="Link"
        >
          <IconLink size={16} />
        </button>
      </InlinePopover>

      <InlinePopover
        placement="bottom"
        defaultOpen={false}
        open={linkMenuOpen}
        onOpenChange={setLinkMenuOpen}
        className="z-50 flex w-72 flex-col items-stretch gap-y-2 rounded-lg border border-border bg-background p-4 shadow-md [&:not([data-state])]:hidden"
      >
        {linkMenuOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const href = (e.target as HTMLFormElement)
                .querySelector("input")
                ?.value?.trim();
              if (href) {
                cmds.addLink?.({ href });
              } else {
                cmds.removeLink?.();
              }
              setLinkMenuOpen(false);
              editor.focus();
            }}
          >
            <input
              placeholder="https://..."
              defaultValue={getLinkHref()}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </form>
        )}
        {markActive("link") && (
          <button
            type="button"
            onClick={() => {
              cmds.removeLink?.();
              setLinkMenuOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
            className="inline-flex items-center justify-center rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90"
          >
            Linki Kaldır
          </button>
        )}
      </InlinePopover>
    </>
  );
}
