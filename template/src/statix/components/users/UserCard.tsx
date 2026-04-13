import Image from "next/image";

import { SignOutButton } from "@/statix/components/layout/SignOutButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/statix/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/statix/components/ui/card";

interface CMSUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserCardProps {
  user?: CMSUser;
}

export function UserCard({ user }: UserCardProps) {
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

        <SignOutButton />
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
