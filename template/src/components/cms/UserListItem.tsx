"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ui from "@/content/ui.json";
import type { CMSUser } from "@/app/admin/users/page";

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.slice(0, 2).toUpperCase();
}

interface UserListItemProps {
  user: CMSUser;
  lastLogin: string;
  isSelf: boolean;
  onClick: () => void;
}

export function UserListItem({ user, lastLogin, isSelf, onClick }: UserListItemProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-label={ui.users.dangerZone.ariaLabel.replace(
        "{name}",
        user.name || user.email,
      )}
      className="gap-0 py-0 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Avatar + name row */}
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
            <AvatarFallback className="text-sm font-medium">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.name || "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          {isSelf && (
            <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded bg-muted">
              {ui.users.status.self}
            </span>
          )}
        </div>

        {/* Role + status */}
        <div className="flex items-center gap-2">
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {user.role === "admin" ? ui.users.roles.admin : ui.users.roles.user}
          </Badge>
          {user.banned ? (
            <span className="text-xs text-destructive font-medium">
              {ui.users.status.banned}
              {user.banExpires &&
                ` (${ui.users.status.bannedUntil.replace(
                  "{date}",
                  new Date(user.banExpires).toLocaleDateString("en-US"),
                )})`}
            </span>
          ) : (
            <span className="text-xs text-green-600 font-medium">
              {ui.users.status.active}
            </span>
          )}
        </div>

        {/* Last login */}
        <p className="text-xs text-muted-foreground">
          {ui.users.lastLogin.replace("{date}", lastLogin)}
        </p>
      </CardContent>
    </Card>
  );
}
