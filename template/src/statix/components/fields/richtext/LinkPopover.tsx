"use client";

import { useCallback, useState } from "react";

import { isMarkActive } from "prosekit/core";
import { useEditor } from "prosekit/react";
import { IconCheck, IconLink, IconTrash } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import { Input } from "@/statix/components/ui/input";
import { Label } from "@/statix/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/statix/components/ui/popover";
import ui from "@/statix/content/ui.json";

interface LinkPopoverProps {
  btnSize?: "sm";
  btnClass?: string;
  iconSize: number;
  btnVariant: (on: boolean) => "default" | "ghost";
}

export function LinkPopover({
  btnSize,
  btnClass,
  iconSize,
  btnVariant,
}: LinkPopoverProps) {
  const editor = useEditor({ update: true });
  const [linkUrl, setLinkUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const openPopover = useCallback(() => {
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
    setIsOpen(true);
  }, [editor]);

  const handleSubmit = useCallback(() => {
    if (!editor.mounted) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cmds = editor.commands as any;
    if (linkUrl === "") {
      cmds.removeLink?.();
    } else {
      cmds.addLink?.({ href: linkUrl });
    }
    setIsOpen(false);
    setLinkUrl("");
  }, [editor, linkUrl]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setLinkUrl("");
  }, []);

  if (!editor.mounted) return null;

  const state = editor.view.state;
  const isLinkActive = isMarkActive(state, "link");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={btnVariant(isLinkActive)}
          size={btnSize}
          className={btnClass}
          onClick={openPopover}
          title={ui.richTextToolbar.link}
        >
          <IconLink size={iconSize} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <Label htmlFor="link-url">{ui.richTextToolbar.linkPopover.label}</Label>
          <div className="flex space-x-2">
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={ui.richTextToolbar.linkPopover.placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
                if (e.key === "Escape") {
                  handleCancel();
                }
              }}
            />
            <Button type="button" size="icon" onClick={handleSubmit}>
              <IconCheck size={iconSize} />
            </Button>
            {isLinkActive && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (editor.commands as any).removeLink?.();
                  setIsOpen(false);
                }}
              >
                <IconTrash size={iconSize} />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
