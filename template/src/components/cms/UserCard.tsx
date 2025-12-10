import Image from "next/image";
import { User } from "next-auth";

import { SignOutButton } from "@/components/cms/SignOutButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface UserCardProps {
  user?: User;
  onSignOut: () => Promise<void>;
}

export function UserCard({ user, onSignOut }: UserCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <Image
          src="/logo-label.svg"
          alt="Logo"
          width={136}
          height={33}
          priority
        />

        <SignOutButton onSignOut={onSignOut} />
      </CardHeader>

      <CardContent className="flex items-center gap-4">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={user?.image || undefined}
            alt={user?.name || "User"}
          />

          <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.name || "User"}</p>

          <small className="text-muted-foreground truncate block">
            {user?.email}
          </small>
        </div>
      </CardContent>
    </Card>
  );
}
