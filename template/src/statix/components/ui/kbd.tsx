import * as React from "react";

import { cn } from "@/statix/lib/utils";

/**
 * `<Kbd>` — small, rounded, muted key cap. Based on shadcn/ui's Base UI
 * `kbd` primitive so it looks uniform with the rest of the Base UI kit:
 *   https://ui.shadcn.com/docs/components/base/kbd
 *
 * Use `<KbdGroup>` to lay out a combo like `<Kbd>⌘</Kbd><Kbd>K</Kbd>`.
 */
function Kbd({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm border border-border/50 px-1 font-sans text-[11px] font-medium select-none",
        "[&_svg:not([class*='size-'])]:size-3",
        className,
      )}
      {...props}
    />
  );
}

function KbdGroup({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
