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

function getLinkHref(editor: ReturnType<typeof useEditor>): string {
  try {
    const { state } = editor.view;
    const { $from } = state.selection;
    const linkMark = state.schema.marks["link"];
    if (!linkMark) return "";
    const mark = linkMark.isInSet(state.storedMarks || $from.marks());
    return mark ? (mark.attrs.href as string) ?? "" : "";
  } catch {
    return "";
  }
}

function getTextAlign(editor: ReturnType<typeof useEditor>): string | null {
  try {
    const { $from } = editor.view.state.selection;
    return ($from.node()?.attrs?.textAlign as string) ?? null;
  } catch {
    return null;
  }
}

export function RichTextToolbar({ toolbar, variant }: RichTextToolbarProps) {
  const editor = useEditor({ update: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cmds = editor.commands as any;
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);

  const openLinkPopover = useCallback(() => {
    const href = getLinkHref(editor);
    setLinkUrl(href);
    setIsLinkPopoverOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (linkUrl === "") {
      cmds.removeLink?.();
    } else {
      cmds.addLink?.({ href: linkUrl });
    }
    setIsLinkPopoverOpen(false);
    setLinkUrl("");
  }, [cmds, linkUrl]);

  const handleLinkCancel = useCallback(() => {
    setIsLinkPopoverOpen(false);
    setLinkUrl("");
  }, []);

  const toggleFontSize = useCallback(() => {
    const isActive = isMarkActive(editor.view.state, "fontSize");
    if (isActive) {
      cmds.unsetFontSize?.();
    } else {
      cmds.setFontSize?.("18px");
    }
  }, [cmds, editor]);

  const toolbarClass =
    variant === "compact"
      ? "border-b border-border p-1 flex flex-wrap gap-0.5"
      : "border-b border-border p-2 flex flex-wrap gap-1";

  const btnSize = variant === "compact" ? undefined : ("sm" as const);
  const btnClass = variant === "compact" ? "h-7 w-7 p-0" : "";
  const iconClass = variant === "compact" ? "h-3 w-3" : "h-4 w-4";

  const btnVariant = (on: boolean): "secondary" | "ghost" =>
    on ? "secondary" : "ghost";

  const state = editor.view.state;
  const currentAlign = getTextAlign(editor);

  return (
    <div className={toolbarClass}>
      {toolbar.includes("bold") && (
        <Button
          type="button"
          variant={btnVariant(isMarkActive(state, "bold"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleBold()}
        >
          <Bold className={iconClass} />
        </Button>
      )}

      {toolbar.includes("italic") && (
        <Button
          type="button"
          variant={btnVariant(isMarkActive(state, "italic"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleItalic()}
        >
          <Italic className={iconClass} />
        </Button>
      )}

      {toolbar.includes("underline") && (
        <Button
          type="button"
          variant={btnVariant(isMarkActive(state, "underline"))}
          size={btnSize}
          className={btnClass}
          onClick={() => cmds.toggleUnderline()}
        >
          <UnderlineIcon className={iconClass} />
        </Button>
      )}

      {toolbar.includes("link") && (
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={btnVariant(isMarkActive(state, "link"))}
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
                {isMarkActive(state, "link") && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      cmds.removeLink?.();
                      setIsLinkPopoverOpen(false);
                    }}
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
          variant={btnVariant(isMarkActive(state, "fontSize"))}
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
              onClick={() => cmds.setTextAlign(align)}
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
          onClick={() => cmds.toggleList({ kind: "bullet" })}
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
          onClick={() => cmds.toggleList({ kind: "ordered" })}
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
          onClick={() => cmds.toggleBlockquote()}
        >
          <Quote className={iconClass} />
        </Button>
      )}
    </div>
  );
}
