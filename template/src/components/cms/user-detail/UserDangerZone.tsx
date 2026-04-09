"use client";

import { IconTrash } from "@tabler/icons-react";

import { useDeleteUser } from "@/hooks/use-users";
import { useUserDetailStore } from "@/stores/useUserDetailStore";
import { AreYouSureDialog } from "@/components/ui/are-you-sure-dialog";
import { Button } from "@/components/ui/button";
import type { CMSUser } from "@/app/admin/users/page";
import ui from "@/content/ui.json";

interface UserDangerZoneProps {
  user: CMSUser;
  onClose: () => void;
  anyLoading: boolean;
}

export function UserDangerZone({ user, onClose, anyLoading }: UserDangerZoneProps) {
  const { deleteDialogOpen } = useUserDetailStore();
  const { setDeleteDialog } = useUserDetailStore();

  const deleteUser = useDeleteUser(user.id, user.email, onClose);

  return (
    <section className="space-y-2 pt-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {ui.users.dangerZone.sectionTitle}
      </p>
      <Button
        size="sm"
        variant="destructive"
        className="h-8 text-xs w-full"
        onClick={() => setDeleteDialog(true)}
        disabled={anyLoading}
      >
        <IconTrash className="w-3.5 h-3.5 mr-1.5" />
        {ui.users.dangerZone.deleteButton}
      </Button>

      <AreYouSureDialog
        open={deleteDialogOpen}
        onOpenChange={(v) => { if (!v) setDeleteDialog(false); }}
        title={ui.users.dangerZone.deleteConfirmTitle}
        confirmVariant="destructive"
        confirmText={ui.users.dangerZone.deleteConfirmButton}
        isLoading={deleteUser.isPending}
        onConfirm={() => deleteUser.mutate()}
        description={
          <span>
            <strong>{user.name || user.email}</strong>{" "}
            {ui.users.dangerZone.deleteDescription}
          </span>
        }
      />
    </section>
  );
}
