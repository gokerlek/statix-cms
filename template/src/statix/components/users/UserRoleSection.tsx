"use client";

import { useEffect, useState, useCallback } from "react";
import { IconLoader2, IconShield, IconCrown } from "@tabler/icons-react";

import { useSetUserPermissions } from "@/statix/hooks/use-users";
import { Button } from "@/statix/components/ui/button";
import { Checkbox } from "@/statix/components/ui/checkbox";
import { Label } from "@/statix/components/ui/label";
import { Badge } from "@/statix/components/ui/badge";
import { Separator } from "@/statix/components/ui/separator";
import {
  AreYouSureDialog,
} from "@/statix/components/ui/are-you-sure-dialog";
import {
  GLOBAL_PERMISSION_KEYS,
  COLLECTION_PERMISSION_KEYS,
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type RolePermissions,
  type CollectionPermissions,
  type GlobalPermissionKey,
} from "@/statix/types/permissions";
import { statixConfig } from "@/statix.config";
import type { CMSUser } from "@/app/(statix)/admin/users/page";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function labelForKey(key: string): string {
  return key
    .replace(/^can/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

const collectionSlugs = statixConfig.collections.map((c) => c.slug);
const collectionMap = new Map(statixConfig.collections.map((c) => [c.slug, c]));

const EMPTY_COLL_PERMS: CollectionPermissions = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canPublish: false,
};

/** Build a full RolePermissions from the preset, expanding "*" wildcard to each collection */
function expandPreset(preset: RolePermissions): RolePermissions {
  const cols: Record<string, CollectionPermissions> = {};
  for (const slug of collectionSlugs) {
    cols[slug] = preset.collections?.[slug] ?? preset.collections?.["*"] ?? EMPTY_COLL_PERMS;
  }
  return { ...preset, collections: cols };
}

/** Check if current permissions match a preset exactly */
function matchesPreset(current: RolePermissions, preset: RolePermissions): boolean {
  const expanded = expandPreset(preset);
  for (const key of GLOBAL_PERMISSION_KEYS) {
    if (!!current[key] !== !!expanded[key]) return false;
  }
  for (const slug of collectionSlugs) {
    const cur = current.collections?.[slug] ?? EMPTY_COLL_PERMS;
    const pre = expanded.collections[slug] ?? EMPTY_COLL_PERMS;
    const isSingleton = collectionMap.get(slug)?.type === "singleton";
    for (const k of COLLECTION_PERMISSION_KEYS) {
      // Skip canCreate/canDelete for singletons — they are always hidden/irrelevant
      if (isSingleton && (k === "canCreate" || k === "canDelete")) continue;
      if (!!cur[k] !== !!pre[k]) return false;
    }
  }
  return true;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserRoleSectionProps {
  user: CMSUser;
  anyLoading: boolean;
  currentUserRole: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function UserRoleSection({
  user,
  anyLoading,
  currentUserRole,
}: UserRoleSectionProps) {
  const setPerms = useSetUserPermissions(user.id);

  const isOwnerUser = user.role === SYSTEM_ROLES.OWNER;
  const currentUserIsOwner = currentUserRole === SYSTEM_ROLES.OWNER;

  const adminPreset = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN];
  const editorPreset = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.EDITOR];

  // ─── Local permission state ─────────────────────────────────────────────────
  const buildInitialPerms = useCallback((): RolePermissions => {
    if (user.permissions) {
      try {
        return expandPreset(JSON.parse(user.permissions) as RolePermissions);
      } catch {
        // fall through to role-based default
      }
    }
    // Fallback: derive from legacy role label
    const base =
      user.role === SYSTEM_ROLES.OWNER || user.role === SYSTEM_ROLES.ADMIN
        ? adminPreset
        : editorPreset;
    return expandPreset(base);
  }, [user.permissions, user.role, adminPreset, editorPreset]);

  const [perms, setPermsState] = useState<RolePermissions>(buildInitialPerms);
  const [hasChanges, setHasChanges] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // Re-sync when user data changes (e.g. after save/refetch)
  useEffect(() => {
    setPermsState(buildInitialPerms());
    setHasChanges(false);
  }, [user.permissions, user.role, buildInitialPerms]);

  // ─── Config-defined custom role presets ──────────────────────────────────────
  const configRoles = (statixConfig.roles ?? []).map((r) => ({
    key: r.name.toLowerCase().replace(/\s+/g, "-"),
    label: r.name,
    preset: r.permissions,
  }));

  // All presets: built-in + config
  const allPresets = [
    { key: "admin", label: "Admin", preset: adminPreset },
    { key: "editor", label: "Editor", preset: editorPreset },
    ...configRoles,
  ];

  // ─── Which preset matches current state? ────────────────────────────────────
  function detectActivePreset(): string {
    for (const p of allPresets) {
      if (matchesPreset(perms, p.preset)) return p.key;
    }
    // If user hasn't customized (no changes, no stored permissions), use role label
    if (!hasChanges && !user.permissions) {
      if (user.role === "owner" || user.role === "admin") return "admin";
      return "editor";
    }
    return "custom";
  }
  const activePreset = detectActivePreset();

  // ─── Handlers ───────────────────────────────────────────────────────────────

  function applyPreset(preset: RolePermissions) {
    setPermsState(expandPreset(preset));
    setHasChanges(true);
  }

  function handleGlobalChange(key: GlobalPermissionKey) {
    setPermsState((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  }

  function handleCollChange(colSlug: string, key: keyof CollectionPermissions) {
    setPermsState((prev) => {
      const current = prev.collections?.[colSlug] ?? EMPTY_COLL_PERMS;
      return {
        ...prev,
        collections: {
          ...prev.collections,
          [colSlug]: { ...current, [key]: !current[key] },
        },
      };
    });
    setHasChanges(true);
  }

  function handleSave() {
    setPerms.mutate(perms, {
      onSuccess: () => setHasChanges(false),
    });
  }

  async function handleTransfer() {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transferOwnership", userId: user.id }),
    });
    if (res.ok) {
      setTransferOpen(false);
      // Reload to reflect new ownership state
      window.location.reload();
    }
  }

  const isLoading = anyLoading || setPerms.isPending;

  return (
    <section className="space-y-4">
      {/* Owner badge */}
      {isOwnerUser && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
            <IconCrown className="w-3 h-3" />
            Owner
          </Badge>
          <span className="text-xs text-muted-foreground">
            Cannot be deleted or banned
          </span>
        </div>
      )}

      {/* Transfer ownership - only visible to current owner, for non-owner users */}
      {currentUserIsOwner && !isOwnerUser && (
        <AreYouSureDialog
          title="Transfer Ownership"
          description={`Transfer ownership to ${user.name || user.email}? You will be demoted to Admin. This cannot be undone.`}
          onConfirm={handleTransfer}
          open={transferOpen}
          onOpenChange={setTransferOpen}
          isLoading={false}
        >
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <IconCrown className="w-3 h-3" />
            Transfer Ownership
          </Button>
        </AreYouSureDialog>
      )}

      {/* Role presets */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Role Preset
        </p>
        <div className="flex flex-wrap gap-2">
          {allPresets.map(({ key, label, preset }) => (
            <button
              key={key}
              type="button"
              disabled={isLoading || isOwnerUser}
              onClick={() => applyPreset(preset)}
              className={[
                "px-3 py-1.5 rounded-md border text-sm font-medium transition-colors",
                activePreset === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted",
                isLoading || isOwnerUser ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
          {activePreset === "custom" && (
            <span className="px-3 py-1.5 rounded-md border border-dashed text-sm font-medium text-muted-foreground">
              Custom
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Permissions */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Permissions
        </p>

        {/* Global */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium">Global</p>
          <div className="grid grid-cols-1 gap-1.5">
            {GLOBAL_PERMISSION_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <Checkbox
                  id={`perm-g-${user.id}-${key}`}
                  checked={!!perms[key]}
                  onCheckedChange={() => handleGlobalChange(key)}
                  disabled={isLoading || isOwnerUser}
                />
                <Label
                  htmlFor={`perm-g-${user.id}-${key}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {labelForKey(key)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Collections */}
        {collectionSlugs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium">Collections</p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-2 py-1.5 font-medium w-24">Collection</th>
                    {COLLECTION_PERMISSION_KEYS.map((key) => (
                      <th key={key} className="text-center px-1 py-1.5 font-medium">
                        {labelForKey(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {collectionSlugs.map((slug, i) => {
                    const cp = perms.collections?.[slug] ?? EMPTY_COLL_PERMS;
                    const isSingleton = collectionMap.get(slug)?.type === "singleton";
                    return (
                      <tr key={slug} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="px-2 py-1.5 font-medium truncate max-w-[96px]">{slug}</td>
                        {COLLECTION_PERMISSION_KEYS.map((key) => {
                          const hidden = isSingleton && (key === "canCreate" || key === "canDelete");
                          return (
                            <td key={key} className="text-center px-1 py-1.5">
                              {hidden ? (
                                <span className="text-muted-foreground/30">—</span>
                              ) : (
                                <Checkbox
                                  checked={!!cp[key]}
                                  onCheckedChange={() => handleCollChange(slug, key)}
                                  disabled={isLoading || isOwnerUser}
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Single save button */}
        {hasChanges && !isOwnerUser && (
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleSave}
            disabled={isLoading}
          >
            {setPerms.isPending ? (
              <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <IconShield className="w-3.5 h-3.5 mr-1" />
            )}
            Save
          </Button>
        )}
      </div>
    </section>
  );
}
