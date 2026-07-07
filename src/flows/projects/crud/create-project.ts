import { projects } from '@/api/projects';
import { toast } from 'sonner';
import type { Project } from '@/storage/types';

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface CreateProjectResult {
  ok: boolean;
  project?: Project;
  error?: string;
}

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  const name = input.name?.trim();
  const description = input.description?.trim();

  if (!name) {
    toast.error('Project name is required');
    return { ok: false, error: 'Project name is required' };
  }

  try {
    const project = await projects.create({ name, description: description || undefined });
    toast.success(`Project "${project.name}" created`);
    return { ok: true, project };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    toast.error(message);
    return { ok: false, error: message };
  }
}
