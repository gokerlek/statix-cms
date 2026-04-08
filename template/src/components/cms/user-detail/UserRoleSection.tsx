"use client";

import { Loader2, Shield } from "lucide-react";

import { useSetUserRole } from "@/hooks/use-users";
import { useUserDetailStore } from "@/stores/useUserDetailStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CMSUser } from "@/app/admin/users/page";
import ui from "@/content/ui.json";

interface UserRoleSectionProps {
  user: CMSUser;
  anyLoading: boolean;
}

export function UserRoleSection({ user, anyLoading }: UserRoleSectionProps) {
  const { pendingRole, demoteConfirmOpen } = useUserDetailStore();
  const { setPendingRole, setDemoteConfirm } = useUserDetailStore();

  const setRole = useSetUserRole(user.id);
  const roleChanged = pendingRole !== (user.role ?? "user");

  function handleRoleSave() {
    if (!roleChanged) return;
    const isDemote = user.role === "admin" && pendingRole === "user";
    if (isDemote && !demoteConfirmOpen) {
      setDemoteConfirm(true);
      return;
    }
    setRole.mutate(pendingRole, {
      onSuccess: () => setDemoteConfirm(false),
    });
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {ui.users.role.sectionTitle}
      </p>

      <div className="flex items-center gap-2">
        <Select
          value={pendingRole}
          onValueChange={(v) => setPendingRole(v as "admin" | "user")}
          disabled={anyLoading}
        >
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">{ui.users.roles.user}</SelectItem>
            <SelectItem value="admin">{ui.users.roles.admin}</SelectItem>
          </SelectContent>
        </Select>

        {roleChanged && (
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleRoleSave}
            disabled={anyLoading}
          >
            {setRole.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <Shield className="w-3.5 h-3.5 mr-1" />
            )}
            {ui.users.role.saveButton}
          </Button>
        )}
      </div>

      {demoteConfirmOpen && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 space-y-2">
          <p className="text-xs text-amber-800">
            {ui.users.role.demoteWarning.replace("{name}", user.name || user.email)}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleRoleSave}
              disabled={setRole.isPending}
            >
              {setRole.isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              {ui.users.role.demoteConfirm}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => {
                setDemoteConfirm(false);
                setPendingRole(user.role ?? "user");
              }}
              disabled={setRole.isPending}
            >
              {ui.users.role.demoteCancel}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
