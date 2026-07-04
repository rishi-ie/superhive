import { and, eq } from 'drizzle-orm';
import { getDb } from '../client';
import { sessions } from '../schema';
import type { Session, SessionCategory, SessionInput } from '../types';

export async function listSessions(
  category?: SessionCategory,
  itemId?: string,
): Promise<Session[]> {
  const db = await getDb();
  const conditions = [];
  if (category) conditions.push(eq(sessions.category, category));
  if (itemId) conditions.push(eq(sessions.itemId, itemId));
  const where = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions);
  const rows = await db
    .select()
    .from(sessions)
    .where(where)
    .orderBy(sessions.createdAt);
  return rows as Session[];
}

export async function getSession(id: string): Promise<Session | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  return (rows[0] as Session | undefined) ?? null;
}

export async function createSession(input: SessionInput): Promise<Session> {
  const db = await getDb();
  const rows = await db.insert(sessions).values(input).returning();
  return rows[0] as Session;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.id, id));
}
