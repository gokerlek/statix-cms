"use client";

import { useCallback, useState } from "react";

import { isMarkActive } from "prosekit/core";
import { useEditor } from "prosekit/react";
import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconBraces,
  IconCheck,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconItalic,
  IconLetterT,
  IconLink,
  IconList,
  IconListNumbers,
  IconMinus,
  IconStrikethrough,
  IconTrash,
  IconUnderline,
} from "@tabler/icons-react";

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

  const currentAlign = (() => {
    try {
      return (state.selection.$from.node()?.attrs?.textAlign as string) ?? null;
    } catch {
      return null;
    }
  })();

  const toolbarClass =
    variant === "compact"
      ? "border-b border-border p-1 flex flex-wrap gap-0.5 items-center"
      : "border-b border-border p-2 flex flex-wrap gap-1 items-center";

  const btnSize = variant === "compact" ? undefined : ("sm" as const);
  const btnClass = variant === "compact" ? "h-7 w-7 p-0" : "";
  const iconSize = variant === "compact" ? 14 : 16;
  const btnVariant = (on: boolean): "secondary" | "ghost" =>
    on ? "secondary" : "ghost";

  return (
    <div className={toolbarClass}>
      {toolbar.includes("undo") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.undo?.()}
          title="Geri Al"
        >
          <IconArrowBackUp size={iconSize} />
        </Button>
      )}

      {toolbar.includes("redo") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.redo?.()}
          title="İleri Al"
        >
          <IconArrowForwardUp size={iconSize} />
        </Button>
      )}

      {toolbar.includes("heading1") && (
        <Button
          type="button"
          variant={btnVariant(nodeActive("heading", { level: 1 }))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleHeading?.({ level: 1 })}
          title="Başlık 1"
        >
          <IconH1 size={iconSize} />
        </Button>
      )}

      {toolbar.includes("heading2") && (
        <Button
          type="button"
          variant={btnVariant(nodeActive("heading", { level: 2 }))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleHeading?.({ level: 2 })}
          title="Başlık 2"
        >
          <IconH2 size={iconSize} />
        </Button>
      )}

      {toolbar.includes("heading3") && (
        <Button
          type="button"
          variant={btnVariant(nodeActive("heading", { level: 3 }))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleHeading?.({ level: 3 })}
          title="Başlık 3"
        >
          <IconH3 size={iconSize} />
        </Button>
      )}

      {toolbar.includes("bold") && (
        <Button
          type="button"
          variant={btnVariant(markActive("bold"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleBold?.()}
          title="Kalın"
        >
          <IconBold size={iconSize} />
        </Button>
      )}

      {toolbar.includes("italic") && (
        <Button
          type="button"
          variant={btnVariant(markActive("italic"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleItalic?.()}
          title="İtalik"
        >
          <IconItalic size={iconSize} />
        </Button>
      )}

      {toolbar.includes("underline") && (
        <Button
          type="button"
          variant={btnVariant(markActive("underline"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleUnderline?.()}
          title="Altı Çizili"
        >
          <IconUnderline size={iconSize} />
        </Button>
      )}

      {toolbar.includes("strike") && (
        <Button
          type="button"
          variant={btnVariant(markActive("strike"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleStrike?.()}
          title="Üstü Çizili"
        >
          <IconStrikethrough size={iconSize} />
        </Button>
      )}

      {toolbar.includes("code") && (
        <Button
          type="button"
          variant={btnVariant(markActive("code"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleCode?.()}
          title="Satır İçi Kod"
        >
          <IconCode size={iconSize} />
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
              title="Link"
            >
              <IconLink size={iconSize} />
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
                  <IconCheck size={iconSize} />
                </Button>
                {markActive("link") && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      cmds.removeLink?.();
                      setIsLinkPopoverOpen(false);
                    }}
                  >
                    <IconTrash size={iconSize} />
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
          onClick={() => {
            if (markActive("fontSize")) {
              cmds.unsetFontSize?.();
            } else {
              cmds.setFontSize?.("18px");
            }
          }}
          title="Büyük Yazı"
        >
          <IconLetterT size={iconSize} />
        </Button>
      )}

      {toolbar.includes("textAlign") && (
        <>
          {[
            { align: "left" as const, Icon: IconAlignLeft },
            { align: "center" as const, Icon: IconAlignCenter },
            { align: "right" as const, Icon: IconAlignRight },
            { align: "justify" as const, Icon: IconAlignJustified },
          ].map(({ align, Icon }) => (
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
        </>
      )}

      {toolbar.includes("bulletList") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleList?.({ kind: "bullet" })}
          title="Madde İşaretli Liste"
        >
          <IconList size={iconSize} />
        </Button>
      )}

      {toolbar.includes("orderedList") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleList?.({ kind: "ordered" })}
          title="Numaralı Liste"
        >
          <IconListNumbers size={iconSize} />
        </Button>
      )}

      {toolbar.includes("blockquote") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleBlockquote?.()}
          title="Alıntı"
        >
          <IconBlockquote size={iconSize} />
        </Button>
      )}

      {toolbar.includes("codeBlock") && (
        <Button
          type="button"
          variant={btnVariant(nodeActive("codeBlock"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.insertCodeBlock?.({ language: "javascript" })}
          title="Kod Bloğu"
        >
          <IconBraces size={iconSize} />
        </Button>
      )}

      {toolbar.includes("horizontalRule") && (
        <Button
          type="button"
          variant="ghost"
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.insertHorizontalRule?.()}
          title="Yatay Çizgi"
        >
          <IconMinus size={iconSize} />
        </Button>
      )}
    </div>
  );
}
