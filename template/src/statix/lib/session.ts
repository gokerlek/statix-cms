import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { user as userTable } from "@/statix/db/schema";
import {
  type RolePermissions,
  type GlobalPermissionKey,
  type CollectionPermissions,
  parsePermissions,
  hasGlobalPermission,
  hasCollectionPermission,
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
} from "@/statix/types/permissions";

// ─── Session ─────────────────────────────────────────────────────────────────

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ─── Permission Resolution ───────────────────────────────────────────────────

/** Fetch the resolved permissions for a user by their ID */
export async function getUserPermissions(
  userId: string
): Promise<RolePermissions> {
  const [row] = await db
    .select({ permissions: userTable.permissions, role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (row?.permissions) {
    return parsePermissions(row.permissions);
  }

  // Legacy fallback: old "admin" or "owner" role gets admin preset
  if (row?.role === "admin" || row?.role === "owner") {
    return DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN];
  }

  // Default to editor
  return DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.EDITOR];
}

// ─── Permission Guards ───────────────────────────────────────────────────────

/** Require a specific global permission (API routes) */
export async function requirePermission(permission: GlobalPermissionKey) {
  const session = await requireSession();
  const permissions = await getUserPermissions(session.user.id);

  if (!hasGlobalPermission(permissions, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }

  return { session, permissions };
}

/** Require a specific collection permission (API routes) */
export async function requireCollectionPermission(
  collectionSlug: string,
  action: keyof CollectionPermissions
) {
  const session = await requireSession();
  const permissions = await getUserPermissions(session.user.id);

  if (!hasCollectionPermission(permissions, collectionSlug, action)) {
    throw new Error(`Forbidden: missing ${action} permission on ${collectionSlug}`);
  }

  return { session, permissions };
}

/** Require any authenticated user (minimum access) */
export async function requireAuthenticated() {
  return requireSession();
}

// ─── Legacy Compat ───────────────────────────────────────────────────────────

/** @deprecated Use requirePermission instead */
export async function requireAdmin() {
  const session = await requireSession();
  const permissions = await getUserPermissions(session.user.id);

  // Check if user has admin-level permissions
  if (permissions.canManageUsers) {
    return session;
  }

  // Legacy fallback
  if ((session.user as Record<string, unknown>)["role"] === "admin") {
    return session;
  }

  throw new Error("Forbidden: missing canManageUsers permission");
}

// ─── RSC Guards (with redirect) ─────────────────────────────────────────────

/** RSC: Require permission or redirect */
export async function requirePermissionOrRedirect(
  permission: GlobalPermissionKey
) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const permissions = await getUserPermissions(session.user.id);
  if (!hasGlobalPermission(permissions, permission)) {
    redirect("/admin/access-denied");
  }

  return { session, permissions };
}

/** RSC: Require collection permission or redirect */
export async function requireCollectionPermissionOrRedirect(
  collectionSlug: string,
  action: keyof CollectionPermissions
) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const permissions = await getUserPermissions(session.user.id);
  if (!hasCollectionPermission(permissions, collectionSlug, action)) {
    redirect("/admin/access-denied");
  }

  return { session, permissions };
}

/** RSC: Require any authenticated session or redirect */
export async function requireSessionOrRedirect() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const permissions = await getUserPermissions(session.user.id);
  return { session, permissions };
}

/** @deprecated Use requirePermissionOrRedirect instead */
export async function requireAdminOrRedirect() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const permissions = await getUserPermissions(session.user.id);
  if (
    !permissions.canManageUsers &&
    (session.user as Record<string, unknown>)["role"] !== "admin" // legacy fallback
  ) {
    redirect("/admin/access-denied");
  }

  return session;
}

// ─── Self or Admin ───────────────────────────────────────────────────────────

export async function requireSelfOrAdmin(targetUserId: string) {
  const session = await requireSession();
  if (session.user.id === targetUserId) return session;

  const permissions = await getUserPermissions(session.user.id);
  if (!hasGlobalPermission(permissions, "canManageUsers")) {
    throw new Error("Forbidden");
  }
  return session;
}

// ─── Owner Check ─────────────────────────────────────────────────────────────

export async function isOwner(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);
  return row?.role === "owner";
}
