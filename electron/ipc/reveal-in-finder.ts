/**
 * Pure helper for `agents:reveal`. Lives in its own file so it can be
 * unit-tested without booting Electron — the IPC handler in `agents.ts`
 * is a one-line wrapper that delegates here.
 *
 * Contract: the caller passes an opaque `agentId`. The helper resolves
 * the local path strictly from `AgentRepository.getById`, validates
 * the folder still exists, and hands it to `shell.showItemInFolder`.
 * No raw paths cross the trust boundary.
 */

import { shell } from 'electron'
import { existsSync } from 'node:fs'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'

export async function revealInFinder(agentId: string): Promise<{ ok: boolean }> {
	if (!agentId || typeof agentId !== 'string') {
		throw new Error('Agent id is required')
	}
	const agent = await AgentRepository.getById(agentId)
	if (!agent?.localPath) {
		throw new Error(`Agent not found or has no folder: ${agentId}`)
	}
	if (!existsSync(agent.localPath)) {
		throw new Error(`Agent folder no longer exists: ${agent.localPath}`)
	}
	shell.showItemInFolder(agent.localPath)
	return { ok: true }
}
