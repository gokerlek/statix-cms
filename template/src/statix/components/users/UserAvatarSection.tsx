"use client";

import { useRef } from "react";
import { IconCamera, IconCheck, IconLoader2, IconPencil, IconUpload, IconX } from "@tabler/icons-react";

import { useUploadAvatar, useRemoveAvatar, useUpdateUserName } from "@/statix/hooks/use-users";
import { useUserDetailStore } from "@/statix/stores/useUserDetailStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/statix/components/ui/avatar";
import { Button } from "@/statix/components/ui/button";
import { Input } from "@/statix/components/ui/input";
import type { CMSUser } from "@/app/admin/users/page";
import ui from "@/statix/content/ui.json";

const MEDIA_BASE = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";

function isCustomAvatar(url: string | null): boolean {
  return !!url && !!MEDIA_BASE && url.startsWith(MEDIA_BASE + "/avatars/");
}

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

interface UserAvatarSectionProps {
  user: CMSUser;
  anyLoading: boolean;
}

export function UserAvatarSection({ user, anyLoading }: UserAvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentImage, editingName, nameValue } = useUserDetailStore();
  const { setCurrentImage, setEditingName, setNameValue } = useUserDetailStore();

  const uploadAvatar = useUploadAvatar(user.id);
  const removeAvatar = useRemoveAvatar(user.id);
  const updateName = useUpdateUserName(user.id);

  const avatarLoading = uploadAvatar.isPending || removeAvatar.isPending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file, {
        onSuccess: (data) => setCurrentImage(data.url),
      });
    }
    e.target.value = "";
  }

  function handleRemove() {
    removeAvatar.mutate(undefined, {
      onSuccess: () => setCurrentImage(null),
    });
  }

  function handleNameSave() {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed.length < 2) return;
    updateName.mutate(trimmed, {
      onSuccess: () => setEditingName(false),
    });
  }

  return (
    <div className="flex items-center gap-4">
      {/* Clickable avatar */}
      <div
        className="relative group cursor-pointer shrink-0"
        onClick={() => !anyLoading && fileInputRef.current?.click()}
      >
        <Avatar className="size-16">
          <AvatarImage src={currentImage ?? undefined} alt={user.name ?? user.email} />
          <AvatarFallback className="text-base font-medium">
            {getInitials(user.name, user.email)}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {avatarLoading ? (
            <IconLoader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <IconCamera className="w-4 h-4 text-white" />
          )}
        </div>
      </div>

      {/* Name + avatar actions */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {editingName ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave();
                if (e.key === "Escape") {
                  setEditingName(false);
                  setNameValue(user.name ?? "");
                }
              }}
              className="h-7 text-sm"
              maxLength={100}
              disabled={updateName.isPending}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={handleNameSave}
              disabled={updateName.isPending}
            >
              {updateName.isPending ? (
                <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <IconCheck className="w-3.5 h-3.5 text-green-600" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                setEditingName(false);
                setNameValue(user.name ?? "");
              }}
            >
              <IconX className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium truncate">{user.name || "—"}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
              onClick={() => setEditingName(true)}
            >
              <IconPencil className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Avatar buttons */}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={anyLoading}
          >
            <IconUpload className="w-3 h-3 mr-1" />
            {currentImage ? ui.users.avatar.change : ui.users.avatar.upload}
          </Button>
          {isCustomAvatar(currentImage) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 text-muted-foreground"
              onClick={handleRemove}
              disabled={anyLoading}
            >
              <IconX className="w-3 h-3 mr-1" />
              {ui.users.avatar.remove}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{ui.users.avatar.hint}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
