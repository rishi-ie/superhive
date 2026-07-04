import { eq } from 'drizzle-orm';
import { getDb } from '../client';
import { projects } from '../schema';
import type { Project, ProjectInput } from '../types';

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
  const db = await getDb();
  const rows = await db.insert(projects).values(input).returning();
  return rows[0] as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(projects).where(eq(projects.id, id));
}
