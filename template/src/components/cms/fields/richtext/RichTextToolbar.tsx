"use client";

import { useCallback, useState } from "react";

import { Editor } from "@tiptap/react";
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
  X,
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
  editor: Editor | null;
  toolbar: readonly string[];
  variant: "normal" | "block" | "compact";
}

export function RichTextToolbar({
  editor,
  toolbar,
  variant,
}: RichTextToolbarProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);

  const handleLinkSubmit = useCallback(() => {
    if (!editor) return;

    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    }

    setIsLinkPopoverOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleLinkCancel = useCallback(() => {
    setIsLinkPopoverOpen(false);
    setLinkUrl("");
  }, []);

  const openLinkPopover = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href || "";

    setLinkUrl(previousUrl);
    setIsLinkPopoverOpen(true);
  }, [editor]);

  const toggleFontSize = () => {
    if (!editor) return;

    const currentSize = editor.getAttributes("textStyle").fontSize;

    if (currentSize === "18px") {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize("18px").run();
    }
  };

  if (!editor) {
    return null;
  }

  const getToolbarClass = () => {
    if (variant === "compact") {
      return "border-b border-border p-1 flex flex-wrap gap-0.5";
    }

    return "border-b border-border p-2 flex flex-wrap gap-1";
  };

  const getButtonSize = () => {
    return variant === "compact" ? "h-7 w-7 p-0" : "sm";
  };

  const getIconSize = () => {
    return variant === "compact" ? "h-3 w-3" : "h-4 w-4";
  };

  return (
    <div className={getToolbarClass()}>
      {toolbar.includes("bold") && (
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size={variant === "compact" ? undefined : "sm"}
          className={variant === "compact" ? getButtonSize() : ""}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className={getIconSize()} />
        </Button>
      )}

      {toolbar.includes("italic") && (
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size={variant === "compact" ? undefined : "sm"}
          className={variant === "compact" ? getButtonSize() : ""}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className={getIconSize()} />
        </Button>
      )}

      {toolbar.includes("underline") && (
        <Button
          type="button"
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size={variant === "compact" ? undefined : "sm"}
          className={variant === "compact" ? getButtonSize() : ""}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className={getIconSize()} />
        </Button>
      )}

      {toolbar.includes("link") && (
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("link") ? "secondary" : "ghost"}
              size={variant === "compact" ? undefined : "sm"}
              className={variant === "compact" ? getButtonSize() : ""}
              onClick={openLinkPopover}
            >
              <LinkIcon className={getIconSize()} />
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
                <Button
                  type="button"
                  size={variant === "compact" ? undefined : "sm"}
                  onClick={handleLinkSubmit}
                >
                  <Check className={getIconSize()} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size={variant === "compact" ? undefined : "sm"}
                  onClick={handleLinkCancel}
                >
                  <X className={getIconSize()} />
                </Button>
              </div>
              {editor.isActive("link") && (
                <Button
                  type="button"
                  variant="destructive"
                  size={variant === "compact" ? undefined : "sm"}
                  className="w-full"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setIsLinkPopoverOpen(false);
                  }}
                >
                  <Trash2 className={`${getIconSize()} mr-2`} />
                  Linki Kaldır
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {toolbar.includes("fontSize") && (
        <Button
          type="button"
          variant={
            editor.getAttributes("textStyle").fontSize ? "secondary" : "ghost"
          }
          size={variant === "compact" ? undefined : "sm"}
          className={variant === "compact" ? getButtonSize() : ""}
          onClick={toggleFontSize}
          title="Büyük Yazı"
        >
          <Type className={getIconSize()} />
        </Button>
      )}

      {toolbar.includes("textAlign") && (
        <>
          <Button
            type="button"
            variant={
              editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"
            }
            size={variant === "compact" ? undefined : "sm"}
            className={variant === "compact" ? getButtonSize() : ""}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className={getIconSize()} />
          </Button>

          <Button
            type="button"
            variant={
              editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"
            }
            size={variant === "compact" ? undefined : "sm"}
            className={variant === "compact" ? getButtonSize() : ""}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className={getIconSize()} />
          </Button>

          <Button
            type="button"
            variant={
              editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"
            }
            size={variant === "compact" ? undefined : "sm"}
            className={variant === "compact" ? getButtonSize() : ""}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className={getIconSize()} />
          </Button>

          <Button
            type="button"
            variant={
              editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"
            }
            size={variant === "compact" ? undefined : "sm"}
            className={variant === "compact" ? getButtonSize() : ""}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify className={getIconSize()} />
          </Button>
        </>
      )}

      {toolbar.includes("bulletList") && (
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size={variant === "compact" ? undefined : "sm"}
          className={variant === "compact" ? getButtonSize() : ""}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className={getIconSize()} />
        </Button>
      )}

      {toolbar.includes("orderedList") && (
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size={variant === "compact" ? undefined : "sm"}
          className={variant === "compact" ? getButtonSize() : ""}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className={getIconSize()} />
        </Button>
      )}

      {toolbar.includes("blockquote") && (
        <Button
          type="button"
          variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
          size={variant === "compact" ? undefined : "sm"}
          className={variant === "compact" ? getButtonSize() : ""}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className={getIconSize()} />
        </Button>
      )}
    </div>
  );
}
