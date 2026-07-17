/**
 * deleteProject — cascades deletion of a project and its project-agent.
 *
 * Order:
 *   1. Resolve the project + its project-agent (kind: project-coordinator)
 *   2. Delete the project row first (so agent-side cleanup sees no project link)
 *   3. Stop the project-agent runtime + delete the agent row + dispose its store slice
 *
 * Used by `ProjectAgentError`'s "Delete Project" button.
 */

import { projects } from '@/api/projects';
import { agents } from '@/api/agents';
import { toast } from 'sonner';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { disposeSlice } from '@/stores/agent';

export interface DeleteProjectResult {
  ok: boolean;
  error?: string;
}

export async function deleteProject(projectId: string): Promise<DeleteProjectResult> {
  try {
    const project = await projects.get(projectId);
    if (!project) {
      toast.error('Project not found');
      return { ok: false, error: 'Project not found' };
    }

    // Find this project's coordinator (project-coordinator kind)
    const allAgents = await listAgents();
    const projectAgent = allAgents.find(
      (a) =>
        a.agentKind === 'project-coordinator' &&
        (a.projectIds?.includes(projectId) ?? false),
    );

    // Delete the project row first
    const ok = await projects.delete(projectId);
    if (!ok) {
      toast.error('Failed to delete project');
      return { ok: false, error: 'Failed to delete project' };
    }

    // Cascade: stop + delete the project-agent + dispose its runtime slice
    if (projectAgent) {
      await agents.stop(projectAgent.id).catch(() => {});
      await agents.delete(projectAgent.id).catch(() => {});
      disposeSlice(projectAgent.id);
    }

    toast.success(`Project "${project.name}" deleted`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete project';
    toast.error(message);
    return { ok: false, error: message };
  }
}