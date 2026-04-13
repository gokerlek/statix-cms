import { Suspense } from "react";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/statix/lib/db";
import { auditLog, user as userTable } from "@/statix/db/schema";
import { requirePermissionOrRedirect } from "@/statix/lib/session";
import { PageLoading } from "@/statix/components/ui/loading";
import { UsersClientPage } from "./UsersClientPage";
import { P } from "@/statix/types/permissions";

export const dynamic = "force-dynamic";

export interface CMSUser {
  id: string;
  name: string | null;
  email: string;
  role: string | null; // legacy label: "owner" | "admin" | "editor"
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  image: string | null;
  createdAt: Date;
  permissions: string | null; // JSON string (RolePermissions) - THE authority
}

export default async function UsersPage() {
  const { session } = await requirePermissionOrRedirect(P.MANAGE_USERS);

  // Fetch all users via direct Drizzle query
  const users: CMSUser[] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      banned: userTable.banned,
      banReason: userTable.banReason,
      banExpires: userTable.banExpires,
      image: userTable.image,
      createdAt: userTable.createdAt,
      permissions: userTable.permissions,
    })
    .from(userTable)
    .limit(100);

  // Fetch last login per user via single GROUP BY query (no N+1)
  const userIds = users.map((u) => u.id);
  const lastLoginMap = new Map<string, Date>();

  if (userIds.length > 0) {
    const lastLogins = await db
      .select({
        userId: auditLog.userId,
        lastLogin: sql<string>`MAX(${auditLog.createdAt})`,
      })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.action, "auth.login"),
          inArray(auditLog.userId, userIds),
        ),
      )
      .groupBy(auditLog.userId);

    for (const row of lastLogins) {
      if (row.userId) {
        lastLoginMap.set(row.userId, new Date(row.lastLogin));
      }
    }
  }

  // Serialise lastLoginMap to plain object for client component
  const lastLogins: Record<string, string> = {};
  for (const [id, date] of lastLoginMap.entries()) {
    lastLogins[id] = date.toISOString();
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <UsersClientPage
        initialUsers={users}
        lastLogins={lastLogins}
        currentUserId={session.user.id}
      />
    </Suspense>
  );
}
