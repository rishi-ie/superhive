import { resolveExtensionPath } from './runtime-paths'

export type AgentProfile = 'standard' | 'project-coordinator' | 'project-member'

export const CORE_EXTENSION_IDS = [
	'superhive-pi-truth',
	'superhive-pi-telemetry',
	'superhive-pi-context',
	'superhive-pi-orchestration',
	'superhive-pi-plan',
	'superhive-pi-spawn',
] as const

export type CoreExtensionId = typeof CORE_EXTENSION_IDS[number]

const PROFILE_EXTENSIONS: Record<AgentProfile, readonly CoreExtensionId[]> = {
	standard: ['superhive-pi-truth', 'superhive-pi-telemetry'],
	'project-member': ['superhive-pi-truth', 'superhive-pi-telemetry', 'superhive-pi-orchestration'],
	'project-coordinator': [
		'superhive-pi-truth',
		'superhive-pi-telemetry',
		'superhive-pi-context',
		'superhive-pi-orchestration',
		'superhive-pi-plan',
	],
}

export function extensionsForProfile(profile: AgentProfile): readonly CoreExtensionId[] {
	return PROFILE_EXTENSIONS[profile]
}

export function extensionReference(id: CoreExtensionId, resourcesPath?: string): string {
	return resolveExtensionPath(id, resourcesPath)
}

/** Logical values remain in manage.json; Pi receives resolved shared paths. */
export function extensionReferences(ids: readonly CoreExtensionId[], resourcesPath?: string): string[] {
	return ids.map((id) => extensionReference(id, resourcesPath))
}

export function extensionSetting(id: CoreExtensionId): string {
	return `./extensions/${id}`
}

export function extensionSettings(ids: readonly CoreExtensionId[]): string[] {
	return ids.map(extensionSetting)
}
