/**
 * Pure helper for `projects:reveal`. Lives in its own file so it can be
 * unit-tested without booting Electron — the IPC handler in `projects.ts`
 * is a one-line wrapper that delegates here.
 *
 * Contract: the caller passes an opaque `projectId`. The helper resolves
 * the local path strictly from `ProjectRepository.getById`, validates
 * the folder still exists, and hands it to `shell.showItemInFolder`.
 * No raw paths cross the trust boundary.
 */

import { shell } from 'electron'
import { existsSync } from 'node:fs'
import { ProjectRepository } from '../../src/storage/repositories/ProjectRepository'

export async function revealProjectInFinder(projectId: string): Promise<{ ok: boolean }> {
	if (!projectId || typeof projectId !== 'string') {
		throw new Error('Project id is required')
	}
	const project = await ProjectRepository.getById(projectId)
	if (!project?.localPath) {
		throw new Error(`Project not found or has no folder: ${projectId}`)
	}
	if (!existsSync(project.localPath)) {
		throw new Error(`Project folder no longer exists: ${project.localPath}`)
	}
	shell.showItemInFolder(project.localPath)
	return { ok: true }
}
