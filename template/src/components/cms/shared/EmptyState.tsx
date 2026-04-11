import { IconInbox } from "@tabler/icons-react";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-40 gap-2 text-sm text-muted-foreground">
      {icon ?? <IconInbox className="h-8 w-8 opacity-40" />}
      <span>{message}</span>
    </div>
  );
}
