import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { aiUsage, notes, players, pokerSessions, users } from '@/lib/db/schema';
import type { AppDB } from '@/lib/db';

export interface OverviewKpis {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  signups7d: number;
  signups30d: number;
  totalPlayers: number;
  totalNotes: number;
  totalSessions: number;
}

export interface RecentUserRow {
  id: string;
  email: string;
  name: string | null;
  tier: 'free' | 'pro';
  preferredLocale: 'en' | 'es';
  subscriptionStatus: string | null;
  createdAt: Date;
}

export interface AiUsageStats {
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  uniqueUsers: number;
}

export interface TopAiUser {
  userId: string | null;
  email: string | null;
  callCount: number;
}

export interface DailyAiCall {
  day: string; // ISO date (YYYY-MM-DD)
  total: number;
  success: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

export async function getOverview(db: AppDB): Promise<OverviewKpis> {
  const sevenDays = daysAgo(7);
  const thirtyDays = daysAgo(30);

  const [
    [{ total: totalUsers }],
    [{ total: freeUsers }],
    [{ total: proUsers }],
    [{ total: signups7d }],
    [{ total: signups30d }],
    [{ total: totalPlayers }],
    [{ total: totalNotes }],
    [{ total: totalSessions }],
  ] = await Promise.all([
    db.select({ total: count() }).from(users).all(),
    db.select({ total: count() }).from(users).where(eq(users.tier, 'free')).all(),
    db.select({ total: count() }).from(users).where(eq(users.tier, 'pro')).all(),
    db.select({ total: count() }).from(users).where(gte(users.createdAt, sevenDays)).all(),
    db.select({ total: count() }).from(users).where(gte(users.createdAt, thirtyDays)).all(),
    db.select({ total: count() }).from(players).all(),
    db.select({ total: count() }).from(notes).all(),
    db.select({ total: count() }).from(pokerSessions).all(),
  ]);

  return {
    totalUsers,
    freeUsers,
    proUsers,
    signups7d,
    signups30d,
    totalPlayers,
    totalNotes,
    totalSessions,
  };
}

export async function getRecentUsers(db: AppDB, limit = 50): Promise<RecentUserRow[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      tier: users.tier,
      preferredLocale: users.preferredLocale,
      subscriptionStatus: users.subscriptionStatus,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .all();
}

export async function getAiUsageStats(db: AppDB, days = 30): Promise<AiUsageStats> {
  const since = daysAgo(days);

  const [{ totalCalls, successCalls, failedCalls, uniqueUsers }] = await db
    .select({
      totalCalls: count(),
      successCalls: sql<number>`sum(case when ${aiUsage.success} = 1 then 1 else 0 end)`,
      failedCalls: sql<number>`sum(case when ${aiUsage.success} = 0 then 1 else 0 end)`,
      uniqueUsers: sql<number>`count(distinct ${aiUsage.userId})`,
    })
    .from(aiUsage)
    .where(gte(aiUsage.createdAt, since))
    .all();

  return {
    totalCalls: Number(totalCalls ?? 0),
    successCalls: Number(successCalls ?? 0),
    failedCalls: Number(failedCalls ?? 0),
    uniqueUsers: Number(uniqueUsers ?? 0),
  };
}

export async function getTopAiUsers(db: AppDB, days = 30, limit = 10): Promise<TopAiUser[]> {
  const since = daysAgo(days);

  const rows = await db
    .select({
      userId: aiUsage.userId,
      email: users.email,
      callCount: count(),
    })
    .from(aiUsage)
    .leftJoin(users, eq(users.id, aiUsage.userId))
    .where(and(gte(aiUsage.createdAt, since), sql`${aiUsage.userId} is not null`))
    .groupBy(aiUsage.userId, users.email)
    .orderBy(desc(count()))
    .limit(limit)
    .all();

  return rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    callCount: Number(r.callCount),
  }));
}

export async function getDailyAiCalls(db: AppDB, days = 14): Promise<DailyAiCall[]> {
  const since = daysAgo(days);

  // SQLite: strftime('%Y-%m-%d', created_at, 'unixepoch') for unix-stored
  // timestamps. Drizzle stores integer timestamps in seconds for {mode:'timestamp'}.
  const rows = await db
    .select({
      day: sql<string>`strftime('%Y-%m-%d', ${aiUsage.createdAt}, 'unixepoch')`,
      total: count(),
      success: sql<number>`sum(case when ${aiUsage.success} = 1 then 1 else 0 end)`,
    })
    .from(aiUsage)
    .where(gte(aiUsage.createdAt, since))
    .groupBy(sql`strftime('%Y-%m-%d', ${aiUsage.createdAt}, 'unixepoch')`)
    .orderBy(sql`strftime('%Y-%m-%d', ${aiUsage.createdAt}, 'unixepoch') desc`)
    .all();

  return rows.map((r) => ({
    day: r.day,
    total: Number(r.total),
    success: Number(r.success ?? 0),
  }));
}
