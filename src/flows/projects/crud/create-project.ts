import { projects } from '@/api/projects';
import { toast } from 'sonner';
import type { Project } from '@/storage/types';
import { createProjectAgent } from '@/flows/agents/crud/create-project-agent';
import { createChannel } from '@/flows/channels/crud/create-channel';
import { appendMessage } from '@/flows/channels/ui/append-message';

export interface CreateProjectInput {
  name: string;
  description?: string;
  localPath?: string;
}

export interface CreateProjectResult {
  ok: boolean;
  project?: Project;
  error?: string;
}

export async function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  const name = input.name?.trim();
  const description = input.description?.trim();
  const localPath = input.localPath?.trim();

  if (!name) {
    toast.error('Project name is required');
    return { ok: false, error: 'Project name is required' };
  }

  try {
    const project = await projects.create({ name, description: description || undefined, localPath: localPath || undefined });
    toast.success(`Project "${project.name}" created`);
    return { ok: true, project };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create project';
    toast.error(message);
    return { ok: false, error: message };
  }
}
