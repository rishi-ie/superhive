import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { projects } from '../schema';
import type { Project, ProjectInput } from '../types';
import { log, logError, describePgError } from '@/lib/logger';

export async function listProjects(): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select().from(projects).orderBy(projects.createdAt);
  return rows as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return (rows[0] as Project | undefined) ?? null;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  log('query', 'createProject input', input);
  const db = await getDb();
  try {
    const values = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? null,
      iconName: input.iconName ?? null,
      settings: input.settings ?? {},
      stats: input.stats ?? {},
      createdAt: new Date(),
    };
    const built = db.insert(projects).values(values).returning();
    const { sql, params } = built.toSQL();
    log('query', 'createProject SQL', { sql, params });
    const rows = await built;
    log('query', `createProject returned ${rows.length} rows`);
    return rows[0] as Project;
  } catch (err) {
    logError('query', 'createProject FAILED', err);
    log('query', 'createProject pg fields', describePgError(err));
    throw err;
  }
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(projects).where(eq(projects.id, id));
}
