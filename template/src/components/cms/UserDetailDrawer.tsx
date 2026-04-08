"use client";

import { useEffect } from "react";

import { useUserDetailStore } from "@/stores/useUserDetailStore";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { UserAvatarSection } from "./user-detail/UserAvatarSection";
import { UserRoleSection } from "./user-detail/UserRoleSection";
import { UserBanSection } from "./user-detail/UserBanSection";
import { UserDangerZone } from "./user-detail/UserDangerZone";
import type { CMSUser } from "@/app/admin/users/page";
import ui from "@/content/ui.json";

interface UserDetailDrawerProps {
  user: CMSUser;
  open: boolean;
  onClose: () => void;
  isSelf: boolean;
}

export function UserDetailDrawer({
  user,
  open,
  onClose,
  isSelf,
}: UserDetailDrawerProps) {
  const { resetUser } = useUserDetailStore();

  // Sync state when a different user is opened
  useEffect(() => {
    resetUser(user);
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Drawer open={open} direction="right" onOpenChange={(v) => { if (!v) onClose(); }}>
      <DrawerContent className="fixed inset-y-0 right-0 h-full w-[360px] sm:w-[400px] max-w-full border-l overflow-y-auto">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-base truncate">
            {user.name || user.email}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-5">
          {/* Avatar + inline name edit */}
          <UserAvatarSection user={user} anyLoading={false} />

          {/* Email */}
          <div className="border rounded-lg divide-y text-sm">
            <InfoRow label="Email" value={user.email} />
          </div>

          {/* Role — non-self only */}
          {!isSelf && (
            <UserRoleSection user={user} anyLoading={false} />
          )}

          {/* Ban / Unban — non-self only */}
          {!isSelf && (
            <UserBanSection user={user} anyLoading={false} />
          )}

          {/* Registration date */}
          <div className="border rounded-lg divide-y text-sm">
            <InfoRow
              label={ui.users.registeredAt}
              value={new Date(user.createdAt).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
          </div>

          {/* Danger zone — non-self only */}
          {!isSelf && (
            <UserDangerZone
              user={user}
              onClose={onClose}
              anyLoading={false}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center px-3 py-2 gap-3">
      <span className="text-muted-foreground w-28 shrink-0 text-sm">{label}</span>
      <span className="text-sm truncate">{value}</span>
    </div>
  );
}
