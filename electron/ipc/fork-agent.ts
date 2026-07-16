/**
 * Pure helpers for `agents:forkFromSettings`. Lives in its own file so
 * it can be unit-tested without booting Electron.
 *
 * Semantics: create a new agent whose folder is fresh, but whose
 * `Superhive-pi-<folder>.json` is a copy of the source agent's
 * settings (model, prompts, permissions, extensions catalog) with a
 * bumped `managedBy` counter. Chat and runtime artifacts start empty.
 *
 * Folder-creation reuses the same pipeline as `agents:create`
 * (mkdir + agent.sh copy + extension symlinks + manifest.json +
 * settings seed), but the seed is the source's settings file
 * rather than `DEFAULT_SETTINGS`.
 *
 * This is "Definition C" — settings-only fork — the smallest coherent
 * "fork from" semantics given the current storage anatomy. See the
 * fork-audit report for the alternatives.
 */

import { cp, writeFile } from 'node:fs/promises'
import { existsSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import type { Agent, AgentKind } from '../../src/storage/types'
import {
	DEFAULT_SETTINGS,
	parseCounter,
	settingsFilePathFor,
	type SettingsFile,
} from '../agent-settings-defaults'
import { GENERAL_KAI_DIR, ensureGeneralKai } from '../install-general-kai'
import { ensureExtension } from '../extension-source'
import { config } from '../config'

const SUPERHIVE_PI_TRUTH_NAME = 'superhive-pi-truth'
const SUPERHIVE_PI_TRUTH_URL = 'https://github.com/rishi-ie/superhive-pi-truth.git'
const SUPERHIVE_PI_TELEMETRY_NAME = 'superhive-pi-telemetry'
const SUPERHIVE_PI_TELEMETRY_URL = 'https://github.com/rishi-ie/superhive-pi-telemetry.git'

export interface ForkInput {
	sourceAgentId: string
	name: string
	folderName: string
	parentDir: string
	agentKind?: AgentKind
}

export async function forkAgentFromSettings(input: ForkInput): Promise<Agent> {
	if (!input.sourceAgentId?.trim()) throw new Error('Source agent id is required')
	if (!input.name?.trim()) throw new Error('Agent name is required')
	if (!input.folderName?.trim()) throw new Error('Agent folder name is required')
	if (!input.parentDir?.trim()) throw new Error('Parent directory is required')

	const source = await AgentRepository.getById(input.sourceAgentId)
	if (!source) throw new Error(`Source agent not found: ${input.sourceAgentId}`)
	if (!source.localPath) {
		throw new Error(`Source agent has no folder: ${source.name}`)
	}

	ensureGeneralKai()

	const folderName = input.folderName.trim()
	const parentDir = input.parentDir.trim().replace(/^~(?=\/|$)/, process.env.HOME ?? '')
	const sourceSettingsPath = settingsFilePathFor(source.localPath)

	let sourceSettings: Record<string, unknown> = DEFAULT_SETTINGS as unknown as Record<string, unknown>
	if (existsSync(sourceSettingsPath)) {
		try {
			const { readFile } = await import('node:fs/promises')
			const raw = await readFile(sourceSettingsPath, 'utf8')
			sourceSettings = JSON.parse(raw) as Record<string, unknown>
		} catch {
			// Source settings unreadable — fall back to defaults
		}
	}

	const myCounter = parseCounter(sourceSettings.managedBy as string | undefined) + 1
	const seed = {
		...(DEFAULT_SETTINGS as unknown as Record<string, unknown>),
		...sourceSettings,
		name: input.name.trim(),
		managedBy: `superhive-pi-truth@1#${myCounter}`,
		lastModified: new Date().toISOString(),
		extensions: [
			'./extensions/superhive-pi-truth',
			'./extensions/superhive-pi-telemetry',
		],
	} as unknown as SettingsFile

	const agent = await AgentRepository.create({
		name: input.name.trim(),
		role: source.role,
		description: source.description,
		localPath: join(parentDir, folderName),
		status: 'idle',
		agentKind: input.agentKind,
	})

	const agentDir = agent.localPath!
	const { mkdir } = await import('node:fs/promises')
	await mkdir(agentDir, { recursive: true })
	await mkdir(join(agentDir, 'extensions'), { recursive: true })

	await cp(join(GENERAL_KAI_DIR, 'agent.sh'), join(agentDir, 'agent.sh'))
	await (await import('node:fs/promises')).chmod(join(agentDir, 'agent.sh'), 0o755)

	const truthSource = ensureExtension(SUPERHIVE_PI_TRUTH_NAME, SUPERHIVE_PI_TRUTH_URL)
	symlinkSync(truthSource, join(agentDir, 'extensions', SUPERHIVE_PI_TRUTH_NAME), 'dir')

	const telSource = ensureExtension(SUPERHIVE_PI_TELEMETRY_NAME, SUPERHIVE_PI_TELEMETRY_URL)
	symlinkSync(telSource, join(agentDir, 'extensions', SUPERHIVE_PI_TELEMETRY_NAME), 'dir')

	const manifestContent = JSON.stringify(
		{
			superhiveId: agent.id,
			version: 1,
			workspace: './workspace',
			extensions: [
				'./extensions/superhive-pi-truth',
				'./extensions/superhive-pi-telemetry',
			],
			environment: {
				MINIMAX_API_KEY: config.minimaxApiKey,
			},
		},
		null,
		2,
	) + '\n'
	await writeFile(join(agentDir, 'manifest.json'), manifestContent, 'utf8')
	symlinkSync('manifest.json', join(agentDir, 'agent.json'))

	const settingsPath = settingsFilePathFor(agentDir)
	await writeFile(settingsPath, JSON.stringify(seed, null, '\t') + '\n', 'utf8')

	return agent
}
