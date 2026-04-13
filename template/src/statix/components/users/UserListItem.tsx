"use client";

import { UserAvatar } from "@/statix/components/shared/UserAvatar";
import { Badge } from "@/statix/components/ui/badge";
import { Card, CardContent } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";
import type { CMSUser } from "@/app/admin/users/page";


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
          <UserAvatar
            src={user.image}
            name={user.name}
            email={user.email}
            className="size-10"
          />
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
          <Badge variant={user.role === "owner" || user.role === "admin" ? "default" : "secondary"}>
            {(user.role ?? "editor").charAt(0).toUpperCase() + (user.role ?? "editor").slice(1)}
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
