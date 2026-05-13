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

// ─── User Context (single-query resolution) ──────────────────────────────────

export interface UserContext {
  permissions: RolePermissions;
  role: string | null;
  banned: boolean;
  banReason: string | null;
}

/**
 * Resolve a user's permissions + role + ban status with a SINGLE DB query.
 *
 * Why one query: every API request used to call getUserPermissions, and now
 * also needs a ban check — doing both as separate SELECTs was an obvious
 * N+1 in the hot path. This consolidates them.
 *
 * Banning policy: `banned = true` AND (`banExpires` is null OR in the
 * future) means the ban is active. An expired ban is treated as inactive
 * — the banned flag itself is not auto-cleared in the DB (audit-friendly).
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  const [row] = await db
    .select({
      permissions: userTable.permissions,
      role: userTable.role,
      banned: userTable.banned,
      banReason: userTable.banReason,
      banExpires: userTable.banExpires,
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  const permissions: RolePermissions = row?.permissions
    ? parsePermissions(row.permissions)
    : row?.role === "admin" || row?.role === "owner"
      ? DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.ADMIN]
      : DEFAULT_ROLE_PERMISSIONS[SYSTEM_ROLES.EDITOR];

  const banActive =
    !!row?.banned && (!row.banExpires || row.banExpires > new Date());

  return {
    permissions,
    role: row?.role ?? null,
    banned: banActive,
    banReason: banActive ? (row?.banReason ?? null) : null,
  };
}

/** Internal: reject with a `Forbidden:` error so api-errors maps it to 403. */
function assertNotBanned(ctx: UserContext) {
  if (ctx.banned) {
    throw new Error("Forbidden: account banned");
  }
}

// ─── Permission Resolution ───────────────────────────────────────────────────

/**
 * Fetch a user's resolved permissions.
 * @deprecated Prefer `getUserContext` if you need any other user metadata;
 * a second call to this would re-query the DB unnecessarily.
 */
export async function getUserPermissions(
  userId: string,
): Promise<RolePermissions> {
  const ctx = await getUserContext(userId);
  return ctx.permissions;
}

// ─── Permission Guards ───────────────────────────────────────────────────────

/** Require a specific global permission (API routes) */
export async function requirePermission(permission: GlobalPermissionKey) {
  const session = await requireSession();
  const ctx = await getUserContext(session.user.id);
  assertNotBanned(ctx);

  if (!hasGlobalPermission(ctx.permissions, permission)) {
    throw new Error(`Forbidden: missing permission ${permission}`);
  }

  return { session, permissions: ctx.permissions };
}

/** Require a specific collection permission (API routes) */
export async function requireCollectionPermission(
  collectionSlug: string,
  action: keyof CollectionPermissions,
) {
  const session = await requireSession();
  const ctx = await getUserContext(session.user.id);
  assertNotBanned(ctx);

  if (!hasCollectionPermission(ctx.permissions, collectionSlug, action)) {
    throw new Error(
      `Forbidden: missing ${action} permission on ${collectionSlug}`,
    );
  }

  return { session, permissions: ctx.permissions };
}

/** Require any authenticated, non-banned user (minimum access) */
export async function requireAuthenticated() {
  const session = await requireSession();
  const ctx = await getUserContext(session.user.id);
  assertNotBanned(ctx);
  return session;
}

// ─── Legacy Compat ───────────────────────────────────────────────────────────

/** @deprecated Use requirePermission instead */
export async function requireAdmin() {
  const session = await requireSession();
  const ctx = await getUserContext(session.user.id);
  assertNotBanned(ctx);

  // Check if user has admin-level permissions
  if (ctx.permissions.canManageUsers) {
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
  permission: GlobalPermissionKey,
) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const ctx = await getUserContext(session.user.id);
  if (ctx.banned) redirect("/admin/access-denied");

  if (!hasGlobalPermission(ctx.permissions, permission)) {
    redirect("/admin/access-denied");
  }

  return { session, permissions: ctx.permissions };
}

/** RSC: Require collection permission or redirect */
export async function requireCollectionPermissionOrRedirect(
  collectionSlug: string,
  action: keyof CollectionPermissions,
) {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const ctx = await getUserContext(session.user.id);
  if (ctx.banned) redirect("/admin/access-denied");

  if (!hasCollectionPermission(ctx.permissions, collectionSlug, action)) {
    redirect("/admin/access-denied");
  }

  return { session, permissions: ctx.permissions };
}

/** RSC: Require any authenticated, non-banned session or redirect */
export async function requireSessionOrRedirect() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const ctx = await getUserContext(session.user.id);
  if (ctx.banned) redirect("/admin/access-denied");

  return { session, permissions: ctx.permissions };
}

/** @deprecated Use requirePermissionOrRedirect instead */
export async function requireAdminOrRedirect() {
  const session = await getSession();
  if (!session) redirect("/auth/signin");

  const ctx = await getUserContext(session.user.id);
  if (ctx.banned) redirect("/admin/access-denied");

  if (
    !ctx.permissions.canManageUsers &&
    (session.user as Record<string, unknown>)["role"] !== "admin" // legacy fallback
  ) {
    redirect("/admin/access-denied");
  }

  return session;
}

// ─── Self or Admin ───────────────────────────────────────────────────────────

export async function requireSelfOrAdmin(targetUserId: string) {
  const session = await requireSession();
  const ctx = await getUserContext(session.user.id);
  assertNotBanned(ctx);

  if (session.user.id === targetUserId) return session;

  if (!hasGlobalPermission(ctx.permissions, "canManageUsers")) {
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
