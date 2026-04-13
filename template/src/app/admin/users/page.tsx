import { Suspense } from "react";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/statix/lib/db";
import { auditLog } from "@/statix/db/schema";
import { requireAdminOrRedirect } from "@/statix/lib/session";
import { auth } from "@/statix/lib/auth";
import { headers } from "next/headers";
import { PageLoading } from "@/statix/components/ui/loading";
import { UsersClientPage } from "./UsersClientPage";

export const dynamic = "force-dynamic";

export interface CMSUser {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "user" | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  image: string | null;
  createdAt: Date;
}

export default async function UsersPage() {
  const session = await requireAdminOrRedirect();

  // Fetch all users via Better Auth admin API
  const reqHeaders = await headers();
  const result = await auth.api.listUsers({
    headers: reqHeaders,
    query: { limit: 100 },
  });

  const users: CMSUser[] = ((result?.users ?? []) as CMSUser[]);

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
