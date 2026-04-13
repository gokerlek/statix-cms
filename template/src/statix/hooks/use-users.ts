import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/statix/content/ui.json";
import type { CMSUser } from "@/app/admin/users/page";
import { QUERY_KEYS } from "@/statix/lib/query-keys";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiResponse<T = Record<string, never>> = T & { error?: string };

async function userPost<T = Record<string, never>>(
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

// ─── Users list (query) ───────────────────────────────────────────────────────

export function useUsers(initialData?: CMSUser[]) {
  return useQuery<CMSUser[]>({
    queryKey: QUERY_KEYS.users,
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = (await res.json()) as { users?: CMSUser[] };
      return data.users ?? [];
    },
    initialData,
    staleTime: 30_000,
  });
}

// ─── Invite ───────────────────────────────────────────────────────────────────

export type InvitePayload = { email: string; role: "admin" | "user" };

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InvitePayload) =>
      userPost({ action: "invite", ...payload }),
    onSuccess: async () => {
      toast.success(ui.users.toasts.inviteSent);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.inviteFailed);
    },
  });
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export function useUploadAvatar(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/users/${userId}/avatar`, {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as ApiResponse<{ url: string }>;
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      return data as { url: string };
    },
    onSuccess: async () => {
      toast.success(ui.users.toasts.avatarUploaded);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.avatarUploadFailed);
    },
  });
}

export function useRemoveAvatar(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/avatar`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
    },
    onSuccess: async () => {
      toast.success(ui.users.toasts.avatarRemoved);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.avatarRemoveFailed);
    },
  });
}

// ─── Name ─────────────────────────────────────────────────────────────────────

export function useUpdateUserName(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) =>
      userPost({ action: "updateName", userId, name }),
    onSuccess: async () => {
      toast.success(ui.users.toasts.nameUpdated);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.nameUpdateFailed);
    },
  });
}

// ─── Role ─────────────────────────────────────────────────────────────────────

export function useSetUserRole(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (role: "admin" | "user") =>
      userPost({ action: "setRole", userId, role }),
    onSuccess: async () => {
      toast.success(ui.users.toasts.roleUpdated);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.roleUpdateFailed);
    },
  });
}

// ─── Ban ──────────────────────────────────────────────────────────────────────

export type BanPayload = {
  banReason?: string;
  banExpiresAt?: string;
};

export function useBanUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BanPayload) =>
      userPost({ action: "ban", userId, ...payload }),
    onSuccess: async () => {
      toast.success(ui.users.toasts.banned);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.banFailed);
    },
  });
}

// ─── Unban ────────────────────────────────────────────────────────────────────

export function useUnbanUser(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => userPost({ action: "unban", userId }),
    onSuccess: async () => {
      toast.success(ui.users.toasts.unbanned);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.unbanFailed);
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteUser(userId: string, email: string, onClose: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => userPost({ action: "delete", userId, email }),
    onSuccess: async () => {
      toast.success(ui.users.toasts.deleted);
      onClose();
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users });
    },
    onError: () => {
      toast.error(ui.users.toasts.deleteFailed);
    },
  });
}
