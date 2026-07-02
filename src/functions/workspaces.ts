/**
 * Pure workspace business logic extracted from data/workspace/store.ts.
 * Operates on the Workspace array passed by callers — does not call DataSource.
 */
import type { Workspace } from '@/data/workspace/interface';

/**
 * Validates a workspace creation input.
 * @param input - Raw input from the workspace modal
 * @returns Trimmed name if valid; null if name is empty
 */
export function validateWorkspaceInput(input: { name: string; description?: string }): { name: string; description?: string } | null {
  const name = input.name.trim();
  if (!name) return null;
  return { name, description: input.description };
}

/**
 * Picks the next workspace to focus after one is deleted.
 * @param remainingWorkspaces - Workspaces still in the DataSource (not including the deleted one)
 * @returns The id of the first non-archived workspace, or empty string if none
 */
export function pickNextWorkspaceAfterDelete(remainingWorkspaces: Workspace[]): string {
  const next = remainingWorkspaces.find((w) => !w.archivedAt);
  return next?.id ?? '';
}
