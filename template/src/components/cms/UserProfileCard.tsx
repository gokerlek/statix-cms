"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { SignOutButton } from "@/components/cms/SignOutButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserDetailDrawer } from "@/components/cms/UserDetailDrawer";
import type { CMSUser } from "@/app/admin/users/page";

interface UserProfileCardProps {
  user: CMSUser;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
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

        <CardContent
          className="flex items-center gap-4 cursor-pointer hover:bg-muted/40 transition-colors rounded-b-lg"
          onClick={() => setDrawerOpen(true)}
          title="Profili düzenle"
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={user.image || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name || "User"}</p>
            <small className="text-muted-foreground truncate block">
              {user.email}
            </small>
          </div>
        </CardContent>
      </Card>

      <UserDetailDrawer
        user={user}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isSelf={true}
      />
    </>
  );
}
