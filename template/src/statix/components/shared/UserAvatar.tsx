import { Avatar, AvatarFallback, AvatarImage } from "@/statix/components/ui/avatar";
import { cn } from "@/statix/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function UserAvatar({ src, name, email, className }: UserAvatarProps) {
  return (
    <Avatar className={cn(className)}>
      <AvatarImage src={src ?? undefined} alt={name ?? email ?? "user"} />
      <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
    </Avatar>
  );
}
