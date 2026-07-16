/**
 * Reconcile the filesystem with the database.
 *
 * Pass 1 — Orphan adoption:
 *   Any folder in ~/.superhive/agents/ that has a Superhive-pi-*.json file
 *   but no corresponding DB row is adopted into the DB with status 'idle'.
 *
 * Pass 2 — Missing folders:
 *   Any DB row whose localPath no longer exists on disk is marked 'idle'
 *   with `lastError` set so the UI surfaces the problem on the agent row.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import log from 'electron-log/main'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'

const DEFAULT_PARENT_DIR = join(homedir(), '.superhive', 'agents')

interface OnDiskAgentConfig {
	superhiveId?: string
	version: number
	name: string
	description?: string
	[k: string]: unknown
}

export async function reconcileAgents(): Promise<void> {
	log.info('[reconcile] starting')

	const dbAgents = await AgentRepository.getAll()
	const byLocalPath = new Map<string, (typeof dbAgents)[number]>()
	for (const a of dbAgents) {
		if (a.localPath) byLocalPath.set(a.localPath, a)
	}

	let adopted = 0
	let missing = 0

	// ================================================================
	// Pass 1 — adopt orphan folders
	// ================================================================
	try {
		const folders = readdirSync(DEFAULT_PARENT_DIR, { withFileTypes: true })
			.filter(
				(d) =>
					d.isDirectory() &&
					!d.name.startsWith('.') &&
					d.name !== 'general-kai-template',
			)
			.map((d) => d.name)

		for (const folder of folders) {
			const localPath = join(DEFAULT_PARENT_DIR, folder)
			if (byLocalPath.has(localPath)) continue

			// Look for the settings file as a marker that this is a Superhive agent
			const settingsFiles = readdirSync(localPath).filter(
				(f) => f.startsWith('Superhive-pi-') && f.endsWith('.json'),
			)
			if (settingsFiles.length === 0) continue

			const disk = { name: folder } as OnDiskAgentConfig
			try {
				const sf = settingsFiles[0]
				if (sf) {
					const raw = readFileSync(join(localPath, sf), 'utf8')
					const parsed = JSON.parse(raw) as OnDiskAgentConfig
					disk.name = parsed.name?.trim() || folder
				}
			} catch {
				// Use folder name as fallback
			}

			const agent = await AgentRepository.create({
				name: disk.name,
				localPath,
				status: 'idle',
			})
			adopted++
			log.info(`[reconcile] adopted ${folder} → ${agent.id}`)
		}
	} catch (err) {
		log.warn('[reconcile] orphan scan failed:', err)
	}

	// ================================================================
	// Pass 2 — mark missing folders as error
	// ================================================================
	const refreshedAgents = await AgentRepository.getAll()
	for (const agent of refreshedAgents) {
		if (!agent.localPath) continue
		if (existsSync(agent.localPath)) continue

		await AgentRepository.update(agent.id, {
			status: 'idle',
			lastError: `Agent folder missing: ${agent.localPath}`,
		})
		missing++
		log.info(`[reconcile] missing folder for ${agent.name} (${agent.id})`)
	}

	log.info(`[reconcile] done — adopted=${adopted} missing=${missing}`)
}
