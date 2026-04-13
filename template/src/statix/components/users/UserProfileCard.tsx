"use client";

import { useState } from "react";
import Image from "next/image";

import { SignOutButton } from "@/statix/components/layout/SignOutButton";
import { UserAvatar } from "@/statix/components/shared/UserAvatar";
import { Card, CardContent, CardHeader } from "@/statix/components/ui/card";
import { UserDetailDrawer } from "@/statix/components/users/UserDetailDrawer";
import type { CMSUser } from "@/app/admin/users/page";

interface UserProfileCardProps {
  user: CMSUser;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
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
          <UserAvatar
            src={user.image}
            name={user.name}
            email={user.email}
            className="h-8 w-8 shrink-0"
          />

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
