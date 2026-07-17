/**
 * prepareProject — creates a project + its coordinator agent, then waits for
 * the coordinator runtime to be ready before resolving. The caller
 * (CreateProjectDialog) owns the navigation decision and the
 * PreparingToast lifecycle.
 *
 * Rollback semantics:
 *   - If project creation fails: nothing to roll back.
 *   - If coordinator creation/start fails: delete the project row.
 *   - If coordinator never reaches ready: keep the project + agent so the
 *     user can retry from /projects/:id (settings file is on disk, the
 *     runtime can be restarted).
 */

import { projects } from '@/api/projects'
import { agents } from '@/api/agents'
import { prepareProjectAgent } from '@/flows/agents/crud/prepare-project-agent'
import type { Project } from '@/types/electron'

export interface PrepareProjectInput {
  name: string
  description?: string
  localPath?: string
}

export type PrepareProjectFailure =
  | { ok: false; reason: 'create-failed'; message: string }
  | { ok: false; reason: 'coordinator-create-failed'; message: string }
  | { ok: false; reason: 'coordinator-start-failed'; message: string }
  | { ok: false; reason: 'coordinator-timeout'; detail: 'runtime'; message?: string }
  | { ok: false; reason: 'coordinator-error'; message: string }
  | { ok: false; reason: 'link-failed'; message: string }

export type PrepareProjectResult =
  | { ok: true; project: Project }
  | PrepareProjectFailure

export async function prepareProject(
  input: PrepareProjectInput,
): Promise<PrepareProjectResult> {
  const name = input.name?.trim()
  const description = input.description?.trim()
  const localPath = input.localPath?.trim()

  if (!name) {
    return { ok: false, reason: 'create-failed', message: 'Project name is required' }
  }

  let project: Project
  try {
    project = await projects.create({
      name,
      description: description || undefined,
      localPath: localPath || undefined,
    })
  } catch (err) {
    return {
      ok: false,
      reason: 'create-failed',
      message: err instanceof Error ? err.message : 'Failed to create project',
    }
  }

  const coordinatorInput = {
    name: `${name} (Coordinator)`,
    folderName: 'agent',
    parentDir: localPath ?? `~/.superhive/projects/${name.toLowerCase().replace(/\s+/g, '-')}`,
  }

  const coordinator = await prepareProjectAgent(coordinatorInput)
  if (!coordinator.ok || !coordinator.agent) {
    await projects.delete(project.id).catch(() => {})
    return mapCoordinatorFailure(coordinator, 'coordinator-create-failed')
  }
  const coordinatorAgent = coordinator.agent

  try {
    await projects.addAgent(project.id, coordinatorAgent.id)
  } catch (err) {
    await projects.delete(project.id).catch(() => {})
    await agents.delete(coordinatorAgent.id).catch(() => {})
    return {
      ok: false,
      reason: 'link-failed',
      message: err instanceof Error ? err.message : 'Failed to link project agent',
    }
  }

  return { ok: true, project }
}

function mapCoordinatorFailure(
  result: Awaited<ReturnType<typeof prepareProjectAgent>>,
  fallbackReason: 'coordinator-create-failed' | 'coordinator-start-failed',
): PrepareProjectFailure {
  if (!result.ok) {
    if (result.reason === 'create-failed') {
      return { ok: false, reason: 'coordinator-create-failed', message: result.message }
    }
    if (result.reason === 'start-failed') {
      return { ok: false, reason: 'coordinator-start-failed', message: result.message }
    }
    if (result.reason === 'error') {
      return { ok: false, reason: 'coordinator-error', message: result.message }
    }
    return {
      ok: false,
      reason: 'coordinator-timeout',
      detail: result.detail,
      message: result.message,
    }
  }
  return { ok: false, reason: fallbackReason, message: 'Unknown coordinator failure' }
}
