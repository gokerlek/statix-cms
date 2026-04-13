"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconUserPlus } from "@tabler/icons-react";

import { useUsers } from "@/statix/hooks/use-users";

import { Button } from "@/statix/components/ui/button";
import { UserDetailDrawer } from "@/statix/components/users/UserDetailDrawer";
import { InviteDialog } from "@/statix/components/users/InviteDialog";
import { UserListItem } from "@/statix/components/users/UserListItem";
import type { CMSUser } from "./page";
import ui from "@/statix/content/ui.json";

// ─── Component ───────────────────────────────────────────────────────────────

interface UsersClientPageProps {
  initialUsers: CMSUser[];
  lastLogins: Record<string, string>;
  currentUserId: string;
}

export function UsersClientPage({
  initialUsers,
  lastLogins,
  currentUserId,
}: UsersClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: users = [] } = useUsers(initialUsers);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const urlHydratedRef = useRef(false);

  const drawerUser = drawerUserId
    ? (users.find((u) => u.id === drawerUserId) ?? null)
    : null;

  // Close drawer if the selected user was deleted
  useEffect(() => {
    if (drawerOpen && !drawerUser) {
      setDrawerOpen(false);
      router.replace("?");
    }
  }, [drawerUser, drawerOpen, router]);

  // Hydrate ?selected= from URL — wait for users to be populated first
  useEffect(() => {
    if (urlHydratedRef.current || users.length === 0) return;
    const selectedId = searchParams.get("selected");
    if (selectedId && users.some((u) => u.id === selectedId)) {
      urlHydratedRef.current = true;
      setDrawerUserId(selectedId);
      setDrawerOpen(true);
    }
  }, [searchParams, users]);

  function openDrawer(u: CMSUser) {
    setDrawerUserId(u.id);
    setDrawerOpen(true);
    router.replace(`?selected=${u.id}`);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    router.replace("?");
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{ui.users.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ui.users.description}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <IconUserPlus className="w-4 h-4 mr-2" />
          {ui.users.inviteButton}
        </Button>
      </div>

      {/* User card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((u) => {
          const lastLogin = lastLogins[u.id]
            ? new Date(lastLogins[u.id]).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";

          return (
            <UserListItem
              key={u.id}
              user={u}
              lastLogin={lastLogin}
              isSelf={u.id === currentUserId}
              onClick={() => openDrawer(u)}
            />
          );
        })}
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      {drawerUser && (
        <UserDetailDrawer
          user={drawerUser}
          open={drawerOpen}
          onClose={closeDrawer}
          isSelf={drawerUser.id === currentUserId}
        />
      )}
    </>
  );
}
