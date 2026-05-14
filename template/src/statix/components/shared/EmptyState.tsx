import { IconInbox } from "@tabler/icons-react";

import { Card, CardContent } from "@/statix/components/ui/card";
import { cn } from "@/statix/lib/utils";

interface EmptyStateProps {
  /**
   * Short single-line message. Rendered beneath the icon. Kept for backwards
   * compatibility with the original inline empty state (monitor widgets etc).
   */
  message?: string;
  /** Override the default inbox icon. */
  icon?: React.ReactNode;
  /** Optional larger heading, rendered above the message. */
  title?: string;
  /** Optional description (multi-line friendly). */
  description?: string;
  /** Optional CTA slot — typically a `<Link>` styled with buttonVariants. */
  action?: React.ReactNode;
  /** When true, wrap the content in a dashed-border `Card`. Use this on full
   *  empty pages (collection list, trash, media library). Default: false for
   *  inline usage (charts, feeds). */
  framed?: boolean;
  className?: string;
}

export function EmptyState({
  message,
  icon,
  title,
  description,
  action,
  framed = false,
  className,
}: EmptyStateProps) {
  const body = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 text-muted-foreground",
        framed ? "py-16" : "h-40 gap-2 text-sm",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center",
          framed && "w-16 h-16 bg-muted rounded-full mb-2",
        )}
      >
        {icon ?? (
          <IconInbox
            className={cn(
              framed ? "w-8 h-8 text-muted-foreground" : "h-8 w-8 opacity-40",
            )}
          />
        )}
      </div>

      {title && (
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      )}

      {(description || message) && (
        <p
          className={cn(
            "text-muted-foreground",
            framed ? "max-w-md" : "",
          )}
        >
          {description ?? message}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );

  if (!framed) return body;

  return (
    <Card className="gap-0 py-0 border-2 border-dashed">
      <CardContent>{body}</CardContent>
    </Card>
  );
}
