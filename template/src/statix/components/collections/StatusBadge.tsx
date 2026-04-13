import { Badge } from "@/statix/components/ui/badge";
import { cn } from "@/statix/lib/utils";

export type Status = "published" | "draft" | "archived";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() as Status;

  const variants: Record<Status, string> = {
    published: "text-status-published border-status-published",
    draft: "text-status-draft border-status-draft",
    archived: "text-status-archived border-status-archived",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        variants[normalizedStatus] || variants.draft,
        className,
      )}
    >
      {normalizedStatus}
    </Badge>
  );
}
