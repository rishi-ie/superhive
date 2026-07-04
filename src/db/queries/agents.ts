import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { agents } from '../schema';
import type { Agent, AgentInput } from '../types';
import { log, logError, describePgError } from '@/lib/logger';

export async function listAgents(): Promise<Agent[]> {
  const db = await getDb();
  const rows = await db.select().from(agents).orderBy(agents.createdAt);
  return rows as Agent[];
}

export async function getAgent(id: string): Promise<Agent | null> {
  const db = await getDb();
  const rows = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return (rows[0] as Agent | undefined) ?? null;
}

export async function createAgent(input: AgentInput): Promise<Agent> {
  log('query', 'createAgent input', input);
  const db = await getDb();
  try {
    const built = db.insert(agents).values(input).returning();
    const { sql, params } = built.toSQL();
    log('query', 'createAgent SQL', { sql, params });
    const rows = await built;
    log('query', `createAgent returned ${rows.length} rows`);
    return rows[0] as Agent;
  } catch (err) {
    logError('query', 'createAgent FAILED', err);
    log('query', 'createAgent pg fields', describePgError(err));
    throw err;
  }
}

export async function updateAgent(
  id: string,
  patch: Partial<AgentInput>,
): Promise<Agent | null> {
  const db = await getDb();
  const rows = await db
    .update(agents)
    .set(patch)
    .where(eq(agents.id, id))
    .returning();
  return (rows[0] as Agent | undefined) ?? null;
}

export async function deleteAgent(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(agents).where(eq(agents.id, id));
}
