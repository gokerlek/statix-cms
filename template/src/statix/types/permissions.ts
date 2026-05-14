// ─── Collection-Level Permissions ────────────────────────────────────────────
export interface CollectionPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean; // Draft → Published status transition
}

// ─── Role Permissions ────────────────────────────────────────────────────────
export interface RolePermissions {
  // Global permissions
  canManageUsers: boolean;
  canViewMonitor: boolean;
  canManageMedia: boolean;
  canManageFiles: boolean;
  canManageTrash: boolean;

  // Per-collection permissions
  // Use "*" key as wildcard default for all collections
  collections: Record<string, CollectionPermissions>;
}

// ─── Role ────────────────────────────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: RolePermissions;
  createdAt: string;
  updatedAt: string;
}

// ─── Permission Constants (single source of truth) ──────────────────────────

/** Global permission keys – use P.MANAGE_USERS instead of "canManageUsers" */
export const P = {
  MANAGE_USERS: "canManageUsers" as const,
  VIEW_MONITOR: "canViewMonitor" as const,
  MANAGE_MEDIA: "canManageMedia" as const,
  MANAGE_FILES: "canManageFiles" as const,
  MANAGE_TRASH: "canManageTrash" as const,
};

/** Collection permission keys – use CP.VIEW instead of "canView" */
export const CP = {
  VIEW: "canView" as const,
  CREATE: "canCreate" as const,
  EDIT: "canEdit" as const,
  DELETE: "canDelete" as const,
  PUBLISH: "canPublish" as const,
};

export type GlobalPermissionKey = keyof Omit<RolePermissions, "collections">;

export const GLOBAL_PERMISSION_KEYS: GlobalPermissionKey[] = Object.values(P);

export const COLLECTION_PERMISSION_KEYS: (keyof CollectionPermissions)[] = Object.values(CP);

// ─── System Role Slugs ──────────────────────────────────────────────────────
export const SYSTEM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  EDITOR: "editor",
} as const;

// ─── Default Permissions for System Roles ────────────────────────────────────
const ALL_COLLECTION_PERMISSIONS: CollectionPermissions = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canPublish: true,
};

const EDITOR_COLLECTION_PERMISSIONS: CollectionPermissions = {
  canView: true,
  canCreate: true,
  canEdit: true,
  canDelete: false,
  canPublish: false,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  [SYSTEM_ROLES.OWNER]: {
    canManageUsers: true,
    canViewMonitor: true,
    canManageMedia: true,
    canManageFiles: true,
    canManageTrash: true,
    collections: { "*": ALL_COLLECTION_PERMISSIONS },
  },
  [SYSTEM_ROLES.ADMIN]: {
    canManageUsers: true,
    canViewMonitor: true,
    canManageMedia: true,
    canManageFiles: true,
    canManageTrash: true,
    collections: { "*": ALL_COLLECTION_PERMISSIONS },
  },
  [SYSTEM_ROLES.EDITOR]: {
    canManageUsers: false,
    canViewMonitor: false,
    canManageMedia: true,
    canManageFiles: true,
    canManageTrash: false,
    collections: { "*": EDITOR_COLLECTION_PERMISSIONS },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve collection permissions from a role, using "*" wildcard fallback */
export function getCollectionPermissions(
  permissions: RolePermissions,
  collectionSlug: string
): CollectionPermissions {
  return (
    permissions.collections[collectionSlug] ??
    permissions.collections["*"] ?? {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canPublish: false,
    }
  );
}

/** Check if a role has a specific global permission */
export function hasGlobalPermission(
  permissions: RolePermissions,
  key: GlobalPermissionKey
): boolean {
  return permissions[key] === true;
}

/** Check if a role has a specific collection permission */
export function hasCollectionPermission(
  permissions: RolePermissions,
  collectionSlug: string,
  action: keyof CollectionPermissions
): boolean {
  const cp = getCollectionPermissions(permissions, collectionSlug);
  return cp[action] === true;
}

/**
 * Parse permissions JSON string safely, always ensuring `collections` exists.
 *
 * Falls back to the Editor preset when the stored JSON is corrupt — but
 * logs loudly so operators can spot DB corruption. Without this log, a
 * user silently dropped from Admin to Editor would look like a bug to
 * them and leave no breadcrumb in the server output.
 */
export function parsePermissions(json: string): RolePermissions {
  try {
    const parsed = JSON.parse(json) as RolePermissions;
    // Ensure collections is always an object
    if (!parsed.collections || typeof parsed.collections !== "object") {
      parsed.collections = { "*": { canView: false, canCreate: false, canEdit: false, canDelete: false, canPublish: false } };
    }
    return parsed;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      "[statix] Failed to parse user.permissions JSON — downgrading to Editor default. " +
        "This means a permission row in the user table is corrupt.",
      { error, jsonPreview: json.slice(0, 200) },
    );
    return DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.EDITOR];
  }
}

/** Merge role template permissions with per-user overrides */
export function mergePermissions(
  rolePermissions: RolePermissions,
  userOverrides: Partial<RolePermissions> | null
): RolePermissions {
  if (!userOverrides) return rolePermissions;

  const merged = { ...rolePermissions };

  // Merge global permissions
  for (const key of GLOBAL_PERMISSION_KEYS) {
    if (userOverrides[key] !== undefined) {
      merged[key] = userOverrides[key]!;
    }
  }

  // Merge collection permissions
  if (userOverrides.collections) {
    merged.collections = { ...rolePermissions.collections };
    for (const [slug, perms] of Object.entries(userOverrides.collections)) {
      merged.collections[slug] = {
        ...(rolePermissions.collections[slug] ??
          rolePermissions.collections["*"] ?? {
            canView: false,
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canPublish: false,
          }),
        ...perms,
      };
    }
  }

  return merged;
}
