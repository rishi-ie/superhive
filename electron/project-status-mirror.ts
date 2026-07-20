/**
 * project-status-mirror — keeps the coordinator's truth file in sync with
 * the runtime status of its members.
 *
 * Gap 1 wiring: whenever a member agent starts/stops/changes status,
 * Electron calls `patchCoordinatorForMemberStatus(memberAgentId, newStatus)`
 * which:
 *   1. Looks up the member agent to find its projectIds
 *   2. For each project, finds the project-coordinator
 *   3. Reads the coordinator's truth settings file
 *   4. Updates `project.members[].status` for the matching agentId
 *   5. Writes back atomically with a writer-counter bump (same pattern as
 *      WRITE_SETTINGS IPC in electron/ipc/agents.ts)
 *
 * The orchestration extension's `project.ts` (in superhive-pi-orchestration)
 * does the same atomic-write logic for its own use during session_start.
 * The two implementations must stay in sync; this file has a seam-3
 * counterpart at `superhive-pi-orchestration/project.ts`.
 *
 * Out of scope (deferred): telemetry-driven status changes. Today only
 * START/STOP/UPDATE_STATUS IPC paths call this helper. Wire telemetry →
 * status-mirror in Gap 2.
 */

import { readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import log from 'electron-log/main'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import { settingsFilePathFor } from './agent-settings-defaults'
import type { AgentStatus } from '../src/storage/types'

interface ProjectMemberLike {
	agentId: string
	name: string
	role?: string
	model?: { provider: string; name: string }
	status: string
	joinedAt: string
}

interface ProjectBlockLike {
	id: string
	name: string
	description: string
	members: ProjectMemberLike[]
}

interface SettingsLike {
	managedBy?: string
	project?: ProjectBlockLike
	[key: string]: unknown
}

const MANAGED_BY_PREFIX = 'superhive-pi-truth@1#'

/**
 * Update `project.members[].status` on the coordinator's truth settings file.
 *
 * Idempotent. No-ops silently when:
 *   - member agent does not exist
 *   - member has no projectIds
 *   - no coordinator exists for any of the member's projects
 *   - the member is not on the coordinator's roster
 *   - the status is unchanged
 */
export async function patchCoordinatorForMemberStatus(
	memberAgentId: string,
	newStatus: AgentStatus,
): Promise<void> {
	const member = await AgentRepository.getById(memberAgentId)
	if (!member?.projectIds.length) return

	for (const projectId of member.projectIds) {
		const coordinator = await findProjectCoordinator(projectId)
		if (!coordinator?.localPath) continue

		const settingsPath = settingsFilePathFor(coordinator.localPath)
		if (!existsSync(settingsPath)) {
			log.warn(
				`[status-mirror] coordinator settings missing for project=${projectId} at ${settingsPath}`,
			)
			continue
		}

		try {
			await patchSingleCoordinator(settingsPath, memberAgentId, newStatus)
		} catch (err) {
			log.error(
				`[status-mirror] failed to patch ${settingsPath}: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}
}

/**
 * Find the project-coordinator for a project. The coordinator is the unique
 * agent in `Project.agentIds` whose `agentKind === 'project-coordinator'`.
 */
async function findProjectCoordinator(projectId: string) {
	const agents = await AgentRepository.getByProject(projectId)
	return agents.find((a) => a.agentKind === 'project-coordinator')
}

async function patchSingleCoordinator(
	settingsPath: string,
	agentId: string,
	newStatus: AgentStatus,
): Promise<void> {
	const raw = await readFile(settingsPath, 'utf8')
	const settings = JSON.parse(raw) as SettingsLike
	if (!settings.project) return

	const idx = settings.project.members.findIndex((m) => m.agentId === agentId)
	if (idx === -1) return

	const existing = settings.project.members[idx]
	if (!existing || existing.status === newStatus) return

	settings.project.members[idx] = { ...existing, status: newStatus }

	const counter = parseCounter(settings.managedBy) + 1
	settings.managedBy = `${MANAGED_BY_PREFIX}${counter}`
	settings.lastModified = new Date().toISOString()

	const serialized = JSON.stringify(settings, null, '\t') + '\n'
	const tmp = join(
		settingsPath + '..',
		`.${settingsPath.split('/').pop()}.${process.pid}.${Date.now()}.tmp`,
	)
	await writeFile(tmp, serialized, 'utf8')
	try {
		await rename(tmp, settingsPath)
	} catch (err) {
		await unlink(tmp).catch(() => {})
		throw err
	}
}

function parseCounter(managedBy: string | undefined): number {
	if (!managedBy) return 0
	const idx = managedBy.indexOf('#')
	if (idx === -1) return 0
	const n = Number.parseInt(managedBy.slice(idx + 1), 10)
	return Number.isFinite(n) ? n : 0
}