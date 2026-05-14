"use client";

import { ReactNode } from "react";

import { Button } from "@/statix/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/statix/components/ui/dialog";
import ui from "@/statix/content/ui.json";
import { cn } from "@/statix/lib/utils";

import { BlockDiffView } from "./diff/BlockDiffView";
import { ListDiffView } from "./diff/ListDiffView";
import { RichTextDiffView } from "./diff/RichTextDiffView";

interface FieldChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldLabel: string;
  fieldType: "richtext" | "list" | "blocks";
  previous: unknown;
  current: unknown;
  onRevert?: () => void;
}

/**
 * Large centered modal that surfaces a detailed diff for a single complex
 * field. Reuses the shared `Dialog` primitive — no new shell component is
 * introduced. Sized wide (`max-w-5xl`) and tall (`h-[85vh]`) so long
 * RichText content and dense change lists have room to breathe.
 */
export function FieldChangeModal({
  open,
  onOpenChange,
  fieldLabel,
  fieldType,
  previous,
  current,
  onRevert,
}: FieldChangeModalProps) {
  let body: ReactNode = null;

  if (fieldType === "richtext") {
    body = (
      <RichTextDiffView
        previousHtml={typeof previous === "string" ? previous : ""}
        currentHtml={typeof current === "string" ? current : ""}
      />
    );
  } else if (fieldType === "list") {
    body = (
      <ListDiffView
        previous={Array.isArray(previous) ? previous : []}
        current={Array.isArray(current) ? current : []}
      />
    );
  } else if (fieldType === "blocks") {
    body = (
      <BlockDiffView
        previous={Array.isArray(previous) ? previous : []}
        current={Array.isArray(current) ? current : []}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col gap-0",
        )}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {ui.fieldIndicator.viewChanges} — {fieldLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">{body}</div>

        <DialogFooter className="px-6 py-4 border-t sm:justify-between gap-2">
          {onRevert ? (
            <Button
              variant="outline"
              onClick={() => {
                onRevert();
                onOpenChange(false);
              }}
            >
              <span aria-hidden className="mr-1">↶</span>
              {ui.fieldIndicator.revertField}
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={() => onOpenChange(false)}>{ui.common.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
