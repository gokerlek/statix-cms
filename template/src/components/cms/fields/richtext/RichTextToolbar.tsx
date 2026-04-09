"use client";

import { useCallback, useState } from "react";

import { isMarkActive } from "prosekit/core";
import { useEditor } from "prosekit/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Trash2,
  Type,
  Underline as UnderlineIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface RichTextToolbarProps {
  toolbar: readonly string[];
  variant: "normal" | "block" | "compact";
}

export function RichTextToolbar({ toolbar, variant }: RichTextToolbarProps) {
  const editor = useEditor({ update: true });
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);

  // All callbacks use editor lazily (access view inside, not at definition time)
  const openLinkPopover = useCallback(() => {
    if (!editor.mounted) return;
    try {
      const { state } = editor.view;
      const { $from } = state.selection;
      const linkMark = state.schema.marks["link"];
      const mark = linkMark?.isInSet(state.storedMarks || $from.marks());
      setLinkUrl(mark ? (mark.attrs.href as string) ?? "" : "");
    } catch {
      setLinkUrl("");
    }
    setIsLinkPopoverOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (!editor.mounted) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cmds = editor.commands as any;
    if (linkUrl === "") {
      cmds.removeLink?.();
    } else {
      cmds.addLink?.({ href: linkUrl });
    }
    setIsLinkPopoverOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleLinkCancel = useCallback(() => {
    setIsLinkPopoverOpen(false);
    setLinkUrl("");
  }, []);

  const handleLinkDelete = useCallback(() => {
    if (!editor.mounted) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.commands as any).removeLink?.();
    setIsLinkPopoverOpen(false);
  }, [editor]);

  const toggleFontSize = useCallback(() => {
    if (!editor.mounted) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cmds = editor.commands as any;
    const active = isMarkActive(editor.view.state, "fontSize");
    if (active) {
      cmds.unsetFontSize?.();
    } else {
      cmds.setFontSize?.("18px");
    }
  }, [editor]);

  // ---- Early return AFTER all hooks ----
  // Editor not mounted yet on first render — render placeholder toolbar
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

  // Safe to access editor.view from here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = editor.commands as any;
  const state = editor.view.state;
  const markActive = (markName: string) => isMarkActive(state, markName);
  const currentAlign = (() => {
    try {
      return (state.selection.$from.node()?.attrs?.textAlign as string) ?? null;
    } catch {
      return null;
    }
  })();

  const toolbarClass =
    variant === "compact"
      ? "border-b border-border p-1 flex flex-wrap gap-0.5"
      : "border-b border-border p-2 flex flex-wrap gap-1";

  const btnSize = variant === "compact" ? undefined : ("sm" as const);
  const btnClass = variant === "compact" ? "h-7 w-7 p-0" : "";
  const iconClass = variant === "compact" ? "h-3 w-3" : "h-4 w-4";
  const btnVariant = (on: boolean): "secondary" | "ghost" =>
    on ? "secondary" : "ghost";

  return (
    <div className={toolbarClass}>
      {toolbar.includes("bold") && (
        <Button
          type="button"
          variant={btnVariant(markActive("bold"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleBold?.()}
        >
          <Bold className={iconClass} />
        </Button>
      )}

      {toolbar.includes("italic") && (
        <Button
          type="button"
          variant={btnVariant(markActive("italic"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleItalic?.()}
        >
          <Italic className={iconClass} />
        </Button>
      )}

      {toolbar.includes("underline") && (
        <Button
          type="button"
          variant={btnVariant(markActive("underline"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleUnderline?.()}
        >
          <UnderlineIcon className={iconClass} />
        </Button>
      )}

      {toolbar.includes("link") && (
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={btnVariant(markActive("link"))}
              size={btnSize}
              className={btnClass}
              onClick={openLinkPopover}
            >
              <LinkIcon className={iconClass} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLinkSubmit();
                    }
                    if (e.key === "Escape") {
                      handleLinkCancel();
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={handleLinkSubmit}>
                  <Check className={iconClass} />
                </Button>
                {markActive("link") && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleLinkDelete}
                  >
                    <Trash2 className={iconClass} />
                  </Button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {toolbar.includes("fontSize") && (
        <Button
          type="button"
          variant={btnVariant(markActive("fontSize"))}
          size={btnSize}
          className={btnClass}
          onClick={toggleFontSize}
          title="Büyük Yazı"
        >
          <Type className={iconClass} />
        </Button>
      )}

      {toolbar.includes("textAlign") && (
        <>
          {[
            { align: "left" as const, Icon: AlignLeft },
            { align: "center" as const, Icon: AlignCenter },
            { align: "right" as const, Icon: AlignRight },
            { align: "justify" as const, Icon: AlignJustify },
          ].map(({ align, Icon }) => (
            <Button
              key={align}
              type="button"
              variant={btnVariant(currentAlign === align)}
              size={btnSize}
              className={btnClass}
              onClick={() => cmds.setTextAlign?.(align)}
            >
              <Icon className={iconClass} />
            </Button>
          ))}
        </>
      )}

      {toolbar.includes("bulletList") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleList?.({ kind: "bullet" })}
        >
          <List className={iconClass} />
        </Button>
      )}

      {toolbar.includes("orderedList") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleList?.({ kind: "ordered" })}
        >
          <ListOrdered className={iconClass} />
        </Button>
      )}

      {toolbar.includes("blockquote") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleBlockquote?.()}
        >
          <Quote className={iconClass} />
        </Button>
      )}
    </div>
  );
}
