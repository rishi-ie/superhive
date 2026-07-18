import { projects } from '@/api/projects';
import { toast } from 'sonner';

export interface RevealProjectResult {
  ok: boolean;
  error?: string;
}

/**
 * Reveal a project's folder in Finder/Explorer.
 *
 * Best-effort: errors are surfaced as a toast and the promise resolves with
 * `{ ok: false, error }` so callers don't need to wrap in try/catch.
 */
export async function revealProject(id: string): Promise<RevealProjectResult> {
  if (!id) {
    toast.error('Project id is required');
    return { ok: false, error: 'Project id is required' };
  }
  try {
    await projects.reveal(id);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to reveal project';
    toast.error(message);
    return { ok: false, error: message };
  }
}
