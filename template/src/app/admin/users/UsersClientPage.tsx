"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { UserPlus, Loader2 } from "lucide-react";

import { useUsers, useInviteUser } from "@/hooks/use-users";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDetailDrawer } from "@/components/cms/UserDetailDrawer";
import type { CMSUser } from "./page";
import ui from "@/content/ui.json";

// ─── Invite form schema ───────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const { data: users = [] } = useUsers(initialUsers);
  const inviteUser = useInviteUser();

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);

  // Invite form — RHF + Zod
  const {
    register,
    control,
    handleSubmit,
    reset: resetInvite,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "user" },
  });

  // Drawer — store selected ID, derive object from users array
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  // Hydrate ?selected= on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedId = params.get("selected");
    if (selectedId && users.some((u) => u.id === selectedId)) {
      setDrawerUserId(selectedId);
      setDrawerOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleInviteSubmit(values: InviteFormValues) {
    inviteUser.mutate(values, {
      onSuccess: () => {
        resetInvite();
        setInviteOpen(false);
      },
    });
  }

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
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{ui.users.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{ui.users.description}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          {ui.users.inviteButton}
        </Button>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((u) => {
          const isSelf = u.id === currentUserId;
          const lastLogin = lastLogins[u.id]
            ? new Date(lastLogins[u.id]).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—";

          return (
            <button
              key={u.id}
              type="button"
              onClick={() => openDrawer(u)}
              aria-label={ui.users.dangerZone.ariaLabel.replace("{name}", u.name || u.email)}
              className="border rounded-lg p-4 bg-card flex flex-col gap-3 w-full text-left
                         cursor-pointer hover:bg-muted/40 transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* Avatar + name row */}
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={u.image ?? undefined} alt={u.name ?? u.email} />
                  <AvatarFallback className="text-sm font-medium">
                    {getInitials(u.name, u.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{u.name || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                {isSelf && (
                  <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 rounded bg-muted">
                    {ui.users.status.self}
                  </span>
                )}
              </div>

              {/* Role + status */}
              <div className="flex items-center gap-2">
                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                  {u.role === "admin" ? ui.users.roles.admin : ui.users.roles.user}
                </Badge>
                {u.banned ? (
                  <span className="text-xs text-destructive font-medium">
                    {ui.users.status.banned}
                    {u.banExpires &&
                      ` (${ui.users.status.bannedUntil.replace(
                        "{date}",
                        new Date(u.banExpires).toLocaleDateString("en-US"),
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
            </button>
          );
        })}
      </div>

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) resetInvite();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ui.users.inviteDialog.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleInviteSubmit)} className="mt-2">
            <FieldGroup>
              <Field>
                <label
                  htmlFor="invite-email"
                  className="text-sm font-medium leading-snug"
                >
                  {ui.users.inviteDialog.emailLabel}
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  {...register("email")}
                  placeholder={ui.users.inviteDialog.emailPlaceholder}
                  disabled={inviteUser.isPending}
                />
                <FieldError errors={[errors.email]} />
              </Field>

              <Field>
                <label
                  htmlFor="invite-role"
                  className="text-sm font-medium leading-snug"
                >
                  {ui.users.inviteDialog.roleLabel}
                </label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as "admin" | "user")}
                      disabled={inviteUser.isPending}
                    >
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">{ui.users.roles.user}</SelectItem>
                        <SelectItem value="admin">{ui.users.roles.admin}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.role]} />
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={inviteUser.isPending}>
                  {inviteUser.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {inviteUser.isPending
                    ? ui.users.inviteDialog.submitting
                    : ui.users.inviteDialog.submitButton}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail drawer */}
      {drawerUser && (
        <UserDetailDrawer
          user={drawerUser}
          open={drawerOpen}
          onClose={closeDrawer}
          isSelf={drawerUser.id === currentUserId}
        />
      )}
    </div>
  );
}
