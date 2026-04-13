import { unstable_cache } from "next/cache";

import { and, count, desc, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/statix/lib/db";
import { auditLog, user } from "@/statix/db/schema";
import { getSystemStats, getRecentActivity } from "@/statix/lib/dashboard-data";
import { statixConfig } from "@/statix.config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedCommit {
  sha: string;
  title: string;
  user: string | null;
  name: string | null;
  authorName: string;
  action: string | null;
  time: string | null;
  isStatix: boolean;
  date: string;
  avatar_url: string;
  html_url?: string;
}

export interface ActivityByUser {
  userEmail: string;
  userName: string | null;
  userAvatar: string | null;
  count: number;
}

export interface ActivityTrendPoint {
  date: string;
  count: number;
}

export interface ActionTypeCount {
  action: string;
  count: number;
}

export interface AuditFeedItem {
  id: string;
  userName: string | null;
  action: string;
  createdAt: Date;
}

export interface SystemStatus {
  rateLimit: { limit: number; remaining: number; reset: number };
  repoDetails: { size: number; open_issues: number };
}

export interface MonitorSummary {
  todayActionCount: number;
  lastLoginAt: Date | null;
  rateLimit: { limit: number; remaining: number; reset: number };
  repoSize: number;
}

// ---------------------------------------------------------------------------
// Commit parsing
// ---------------------------------------------------------------------------

export function parseStatixCommit(message: string): Omit<ParsedCommit, "sha" | "date" | "avatar_url" | "html_url" | "authorName"> {
  const lines = message.split("\n");
  const meta: Record<string, string> = {};

  for (const line of lines) {
    const match = line.match(/^statix-(\w+):\s*(.+)$/);
    if (match) meta[match[1]] = match[2];
  }

  return {
    title: lines[0],
    user: meta.user || null,
    name: meta.name || null,
    action: meta.action || null,
    time: meta.time || null,
    isStatix: !!meta.user,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Internal avatar URLs (/api/media/serve/...) must be relative for next/image. */
function toImageSrc(url: string | null): string | null {
  if (!url) return null;

  try {
    const { pathname } = new URL(url);

    if (pathname.startsWith("/api/")) return pathname;
  } catch {
    // already relative
  }

  return url;
}

// ---------------------------------------------------------------------------
// Cached commits
// ---------------------------------------------------------------------------

export const getCachedCommits = unstable_cache(
  async (limit: number = 20): Promise<ParsedCommit[]> => {
    const commits = await getRecentActivity(limit);

    const parsed = commits.map((c) => ({
      sha: c.sha,
      date: c.author.date,
      avatar_url: c.author.avatar_url,
      authorName: c.author.name,
      html_url: c.html_url,
      ...parseStatixCommit(c.message),
    }));

    // Collect emails from statix-tagged commits and look up DB users
    const statixEmails = parsed.filter((c) => c.isStatix && c.user).map((c) => c.user!);

    const userMap = new Map<string, { name: string; image: string | null }>();

    if (statixEmails.length > 0) {
      const dbUsers = await db
        .select({ email: user.email, name: user.name, image: user.image })
        .from(user)
        .where(inArray(user.email, statixEmails));

      dbUsers.forEach((u) => userMap.set(u.email, { name: u.name, image: u.image }));
    }

    // Replace name + avatar with DB values when available
    return parsed.map((c) => {
      if (!c.isStatix || !c.user) return c;

      const dbUser = userMap.get(c.user);

      if (!dbUser) return c;

      return {
        ...c,
        name: dbUser.name,
        avatar_url: toImageSrc(dbUser.image) ?? c.avatar_url,
      };
    });
  },
  ["monitor-commits"],
  { revalidate: 60 },
);

// ---------------------------------------------------------------------------
// Activity by user (last N days)
// ---------------------------------------------------------------------------

export async function getActivityByUser(days: number = 30): Promise<ActivityByUser[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userEmail: auditLog.userEmail,
      userName: user.name,
      userImage: user.image,
      count: count(),
    })
    .from(auditLog)
    .leftJoin(user, eq(auditLog.userEmail, user.email))
    .where(gte(auditLog.createdAt, since))
    .groupBy(auditLog.userEmail)
    .orderBy(desc(count()))
    .limit(10);

  return rows.map((r) => ({
    userEmail: r.userEmail ?? "Unknown",
    userName: r.userName ?? null,
    userAvatar: r.userImage ? toImageSrc(r.userImage) : null,
    count: r.count,
  }));
}

// ---------------------------------------------------------------------------
// Activity trend (daily, last N days)
// ---------------------------------------------------------------------------

export async function getActivityTrend(days: number = 30): Promise<ActivityTrendPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`strftime('%Y-%m-%d', datetime(${auditLog.createdAt}, 'unixepoch'))`.as("date"),
      count: count(),
    })
    .from(auditLog)
    .where(gte(auditLog.createdAt, since))
    .groupBy(sql`strftime('%Y-%m-%d', datetime(${auditLog.createdAt}, 'unixepoch'))`)
    .orderBy(sql`strftime('%Y-%m-%d', datetime(${auditLog.createdAt}, 'unixepoch'))`);

  return rows.map((r) => ({ date: r.date, count: r.count }));
}

// ---------------------------------------------------------------------------
// Action type distribution
// ---------------------------------------------------------------------------

export async function getActionTypeDistribution(): Promise<ActionTypeCount[]> {
  const rows = await db
    .select({
      action: auditLog.action,
      count: count(),
    })
    .from(auditLog)
    .groupBy(auditLog.action)
    .orderBy(desc(count()))
    .limit(20);

  return rows.map((r) => ({ action: r.action, count: r.count }));
}

// ---------------------------------------------------------------------------
// Collection counts
// ---------------------------------------------------------------------------

export interface CollectionCount {
  slug: string;
  label: string;
  count: number;
}

export async function getContentChangesByCollection(): Promise<CollectionCount[]> {
  const rows = await db
    .select({
      slug: sql<string>`json_extract(${auditLog.metadata}, '$.collection')`,
      count: count(),
    })
    .from(auditLog)
    .where(sql`${auditLog.action} LIKE 'content.%'`)
    .groupBy(sql`json_extract(${auditLog.metadata}, '$.collection')`)
    .orderBy(desc(count()));

  return rows
    .filter((r) => r.slug)
    .map((r) => {
      const col = statixConfig.collections.find((c) => c.slug === r.slug);
      return { slug: r.slug, label: col?.label ?? r.slug, count: r.count };
    });
}

// ---------------------------------------------------------------------------
// Recent audit feed
// ---------------------------------------------------------------------------

export async function getRecentAuditFeed(limit: number = 10): Promise<AuditFeedItem[]> {
  const rows = await db
    .select({
      id: auditLog.id,
      // name boşsa email'e düş; auth events için entityId = user.id üzerinden join
      userName: sql<string | null>`NULLIF(COALESCE(NULLIF(${user.name}, ''), ${user.email}), '')`,
      action: auditLog.action,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(
      user,
      or(
        eq(auditLog.userEmail, user.email),
        and(isNull(auditLog.userEmail), eq(auditLog.entityId, user.id)),
      ),
    )
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  return rows;
}

// ---------------------------------------------------------------------------
// System status (reuses cached getSystemStats + user count)
// ---------------------------------------------------------------------------

export async function getSystemStatus(): Promise<SystemStatus> {
  const stats = await getSystemStats();

  return {
    rateLimit: stats.rateLimit,
    repoDetails: stats.repoDetails,
  };
}

// ---------------------------------------------------------------------------
// Monitor summary (for admin page summary card)
// ---------------------------------------------------------------------------

export async function getMonitorSummary(): Promise<MonitorSummary> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayCount, lastLogin, stats] = await Promise.all([
    db
      .select({ count: count() })
      .from(auditLog)
      .where(gte(auditLog.createdAt, todayStart)),
    db
      .select({ createdAt: auditLog.createdAt })
      .from(auditLog)
      .where(sql`${auditLog.action} = 'auth.login'`)
      .orderBy(desc(auditLog.createdAt))
      .limit(1),
    getSystemStats(),
  ]);

  return {
    todayActionCount: todayCount[0]?.count ?? 0,
    lastLoginAt: lastLogin[0]?.createdAt ?? null,
    rateLimit: stats.rateLimit,
    repoSize: stats.repoDetails.size,
  };
}
