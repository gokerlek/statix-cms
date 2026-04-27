import {
  COLLECTION_PERMISSION_KEYS,
  GLOBAL_PERMISSION_KEYS,
  SYSTEM_ROLES,
  type CollectionPermissions,
  type RolePermissions,
  DEFAULT_ROLE_PERMISSIONS,
  parsePermissions,
} from "@/statix/types/permissions";
import { statixConfig } from "@/statix.config";

/**
 * Role-detection helpers shared by:
 *  - `UserRoleSection` (drawer: drives the active-preset chip)
 *  - `UserListItem` (list row: shows "Custom" for users whose stored
 *    permissions don't match any preset)
 *
 * Single source of truth for "which preset does this user effectively
 * have?" — without it the list shows the legacy `role` label even when
 * a user has been customised, which made the badge flicker between
 * "Editor" and "Custom" depending on which screen you were on.
 */

const collectionSlugs = statixConfig.collections.map((c) => c.slug);
const collectionMap = new Map(
  statixConfig.collections.map((c) => [c.slug, c]),
);

const EMPTY_COLL_PERMS: CollectionPermissions = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canPublish: false,
};

/** Materialise wildcard `"*"` into per-collection entries. */
export function expandPreset(preset: RolePermissions): RolePermissions {
  const cols: Record<string, CollectionPermissions> = {};
  for (const slug of collectionSlugs) {
    cols[slug] =
      preset.collections?.[slug] ??
      preset.collections?.["*"] ??
      EMPTY_COLL_PERMS;
  }
  return { ...preset, collections: cols };
}

/** Strict equality between a `current` snapshot and a preset. */
export function matchesPreset(
  current: RolePermissions,
  preset: RolePermissions,
): boolean {
  const expanded = expandPreset(preset);
  for (const key of GLOBAL_PERMISSION_KEYS) {
    if (!!current[key] !== !!expanded[key]) return false;
  }
  for (const slug of collectionSlugs) {
    const cur = current.collections?.[slug] ?? EMPTY_COLL_PERMS;
    const pre = expanded.collections[slug] ?? EMPTY_COLL_PERMS;
    const isSingleton = collectionMap.get(slug)?.type === "singleton";
    for (const k of COLLECTION_PERMISSION_KEYS) {
      // Singletons hide canCreate/canDelete in the UI, so they don't
      // factor into preset matching either.
      if (isSingleton && (k === "canCreate" || k === "canDelete")) continue;
      if (!!cur[k] !== !!pre[k]) return false;
    }
  }
  return true;
}

export interface PresetEntry {
  key: string;
  label: string;
  preset: RolePermissions;
}

/** Built-in + config-defined presets, in display order. */
export function getAllPresets(): PresetEntry[] {
  const adminPreset = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN];
  const editorPreset = DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.EDITOR];
  const configRoles = (statixConfig.roles ?? []).map((r) => ({
    key: r.name.toLowerCase().replace(/\s+/g, "-"),
    label: r.name,
    preset: r.permissions,
  }));
  return [
    { key: "admin", label: "Admin", preset: adminPreset },
    { key: "editor", label: "Editor", preset: editorPreset },
    ...configRoles,
  ];
}

/**
 * Resolve the effective preset key for a user. Returns the matching
 * preset key (`"admin"` / `"editor"` / config role key) or `"custom"`
 * when stored permissions don't line up with any preset.
 *
 * Owner is special-cased — the legacy `"owner"` role label maps to the
 * Admin preset since the two share a permission template (Owner only
 * differs in transfer rights, which aren't permission-encoded).
 */
export function detectUserPreset(user: {
  role: string | null;
  permissions: string | null;
}): string {
  // No stored permissions → fall back to the legacy role label.
  if (!user.permissions) {
    if (
      user.role === SYSTEM_ROLES.OWNER ||
      user.role === SYSTEM_ROLES.ADMIN
    ) {
      return "admin";
    }
    return "editor";
  }

  const current = expandPreset(parsePermissions(user.permissions));
  for (const p of getAllPresets()) {
    if (matchesPreset(current, p.preset)) return p.key;
  }
  return "custom";
}

/**
 * Look up a preset's display label. Falls back to a title-cased key so
 * arbitrary config roles still render sensibly.
 */
export function getPresetLabel(key: string): string {
  if (key === "custom") return "Custom";
  const found = getAllPresets().find((p) => p.key === key);
  if (found) return found.label;
  return key.charAt(0).toUpperCase() + key.slice(1);
}
