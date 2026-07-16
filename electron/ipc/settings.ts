import { ipcMain } from 'electron'
import { SettingsRepository } from '../../src/storage/repositories'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { IPC } from './index'
import { reSeedProviders } from './runtime'

const GLOBAL_OWNER_TYPE = 'global' as const
const GLOBAL_OWNER_ID = 'global' as const
const GROUP_PROVIDERS = 'providers' as const
const GROUP_MODELS = 'models' as const

interface SetProviderInput {
	name?: string
	baseUrl?: string | null
	apiKey?: string
	enabled?: boolean
	preferredModel?: string
	accessKeyId?: string
	secretAccessKey?: string
	region?: string
}

interface ProviderEntry {
	name?: string
	baseUrl?: string | null
	apiKey?: string
	enabled?: boolean
	preferredModel?: string
	accessKeyId?: string
	secretAccessKey?: string
	region?: string
}

interface ModelEntry {
	id: string
	provider: string
	name: string
	enabled: boolean
	isCustom?: boolean
	contextWindow?: number
}

/**
 * Re-seed the per-agent `providers` block on every known agent. Best-effort:
 * a single agent's failure must not block the others or the originating call.
 */
async function reSeedAllAgents(): Promise<void> {
	const agents = await AgentRepository.getAll()
	for (const agent of agents) {
		try {
			await reSeedProviders(agent.id)
		} catch (err) {
			console.error(`[settings] reSeedProviders failed for agent ${agent.id}:`, err)
		}
	}
}

/**
 * Sync the preferred-model row for a provider block.
 *
 * Behavior contract:
 * - If `preferredModel` is non-empty: ensure row `${name}:${preferredModel}` exists
 *   in `models` group with `enabled = !!enabled` and `isCustom: true`. Update
 *   enabled if the row already exists.
 * - If `preferredModel` is empty: delete any prior preferred-model row
 *   belonging to this provider (rows with `isCustom: true` whose id matches
 *   the previously stored preferred-model name, or whose name matches the
 *   preferred-model slot for this provider).
 */
async function syncPreferredModelRow(
	providerName: string,
	preferredModel: string | undefined,
	enabled: boolean,
	previousPreferredModel: string | undefined,
): Promise<void> {
	const newName = preferredModel?.trim() ?? ''
	if (newName) {
		const id = `${providerName}:${newName}`
		await SettingsRepository.setSetting(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			id,
			{ id, provider: providerName, name: newName, enabled, isCustom: true },
			'json',
			newName,
			undefined,
			GROUP_MODELS,
		)
		return
	}

	// Empty preferred model — remove previously stored preferred-model row.
	const candidates = new Set<string>()
	if (previousPreferredModel && previousPreferredModel.trim()) {
		candidates.add(`${providerName}:${previousPreferredModel}`)
	}
	// Defensive: also clean any old preferred-model rows for this provider
	// that have no other curated equivalent.
	const modelRows = await SettingsRepository.getByOwnerAndGroup(
		GLOBAL_OWNER_TYPE,
		GLOBAL_OWNER_ID,
		GROUP_MODELS,
	)
	for (const row of modelRows) {
		const entry = row.value as ModelEntry
		if (entry?.provider === providerName && entry?.isCustom) {
			candidates.add(row.key)
		}
	}
	for (const key of candidates) {
		await SettingsRepository.removeSetting(GLOBAL_OWNER_TYPE, GLOBAL_OWNER_ID, key)
	}
}

export function registerSettingsIpc(): void {
	ipcMain.handle(IPC.SETTINGS.GET_PROVIDERS, async () => {
		const rows = await SettingsRepository.getByOwnerAndGroup(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			GROUP_PROVIDERS,
		)
		const out: Record<string, ProviderEntry> = {}
		for (const row of rows) {
			out[row.key] = (row.value as ProviderEntry) ?? {}
		}
		return out
	})

	ipcMain.handle(
		IPC.SETTINGS.SET_PROVIDER,
		async (_e, input: SetProviderInput) => {
			const name = input.name?.trim()
			if (!name) throw new Error('Provider name is required')

			const existingRow = await SettingsRepository.getSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				name,
			)
			const previous = (existingRow?.value as ProviderEntry | undefined) ?? {}
			const previousHadKey = Boolean(previous.apiKey?.trim())
			const newHasKey = Boolean(input.apiKey?.trim())
			const keyBeingCleared = previousHadKey && !newHasKey

			const value: ProviderEntry = {
				name,
				baseUrl: input.baseUrl ?? null,
				apiKey: input.apiKey,
				enabled: keyBeingCleared ? false : Boolean(input.enabled),
				preferredModel: keyBeingCleared
					? undefined
					: (input.preferredModel ?? previous.preferredModel),
				accessKeyId: input.accessKeyId ?? previous.accessKeyId,
				secretAccessKey: input.secretAccessKey ?? previous.secretAccessKey,
				region: input.region ?? previous.region,
			}

			await SettingsRepository.setSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				name,
				value,
				'json',
				name,
				undefined,
				GROUP_PROVIDERS,
			)

			await syncPreferredModelRow(
				name,
				value.preferredModel,
				value.enabled === true,
				previous.preferredModel,
			)

			if (keyBeingCleared) {
				// Disable any enabled rows for this provider (curated + custom).
				const modelRows = await SettingsRepository.getByOwnerAndGroup(
					GLOBAL_OWNER_TYPE,
					GLOBAL_OWNER_ID,
					GROUP_MODELS,
				)
				for (const row of modelRows) {
					const entry = row.value as ModelEntry
					if (entry?.provider !== name || !entry.enabled) continue
					await SettingsRepository.setSetting(
						GLOBAL_OWNER_TYPE,
						GLOBAL_OWNER_ID,
						row.key,
						{ ...entry, enabled: false },
						'json',
						entry.name,
						undefined,
						GROUP_MODELS,
					)
				}
			}

			await reSeedAllAgents()
		},
	)

	ipcMain.handle(IPC.SETTINGS.DELETE_PROVIDER, async (_e, name: string) => {
		await SettingsRepository.removeSetting(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			name,
		)
		// Cascade: disable every model that referenced this provider so the
		// ModelPicker no longer shows stale entries. We don't delete the
		// model rows — the user may add a new key for the same provider and
		// re-enable them. Only `enabled` is touched.
		const modelRows = await SettingsRepository.getByOwnerAndGroup(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			GROUP_MODELS,
		)
		for (const row of modelRows) {
			const entry = row.value as ModelEntry
			if (entry?.provider !== name || !entry.enabled) continue
			await SettingsRepository.setSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				row.key,
				{ ...entry, enabled: false },
				'json',
				entry.name,
				undefined,
				GROUP_MODELS,
			)
		}
		// Re-seed every agent so a removed key is no longer registered.
		await reSeedAllAgents()
	})

	ipcMain.handle(IPC.SETTINGS.GET_MODELS, async () => {
		const rows = await SettingsRepository.getByOwnerAndGroup(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			GROUP_MODELS,
		)
		return rows.map((row) => row.value as ModelEntry)
	})

	ipcMain.handle(
		IPC.SETTINGS.SET_MODEL_ENABLED,
		async (_e, id: string, enabled: boolean) => {
			const existing = await SettingsRepository.getSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				id,
			)
			if (existing) {
				const current = existing.value as ModelEntry
				await SettingsRepository.setSetting(
					GLOBAL_OWNER_TYPE,
					GLOBAL_OWNER_ID,
					id,
					{ ...current, enabled },
					'json',
					current.name,
					undefined,
					GROUP_MODELS,
				)
				return
			}
			// Curated row that doesn't exist yet — derive provider + name from id
			// (`provider:modelName` convention) and insert as a non-custom row.
			const colon = id.indexOf(':')
			if (colon <= 0) throw new Error(`Invalid model id: ${id}`)
			const provider = id.slice(0, colon)
			const name = id.slice(colon + 1)
			await SettingsRepository.setSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				id,
				{ id, provider, name, enabled, isCustom: false },
				'json',
				name,
				undefined,
				GROUP_MODELS,
			)
		},
	)

	ipcMain.handle(
		IPC.SETTINGS.ADD_MODEL,
		async (_e, input: { provider: string; name: string; contextWindow?: number }) => {
			const provider = input.provider?.trim()
			const name = input.name?.trim()
			if (!provider) throw new Error('Provider is required')
			if (!name) throw new Error('Model name is required')
			const id = `${provider}:${name}`
			// TODO: contextWindow in input is deprecated and ignored — kept on the
			// IPC signature for backward compatibility. New flows leave it unset and
			// the main process fills it in from superhive-pi-telemetry's `model`
			// event (resolved via Pi's modelRegistry + HARDCODED_CONTEXT_WINDOWS
			// fallback) the first time the model is selected.
			await SettingsRepository.setSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				id,
				{ id, provider, name, enabled: true, isCustom: true, contextWindow: undefined },
				'json',
				name,
				undefined,
				GROUP_MODELS,
			)
		},
	)

	ipcMain.handle(IPC.SETTINGS.DELETE_MODEL, async (_e, id: string) => {
		await SettingsRepository.removeSetting(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			id,
		)
	})

	ipcMain.handle(IPC.SETTINGS.GET_ENABLED_MODELS, async () => {
		const rows = await SettingsRepository.getByOwnerAndGroup(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			GROUP_MODELS,
		)
		return rows
			.map((row) => row.value as ModelEntry)
			.filter((m) => m.enabled)
			.map((m) => ({ id: m.id, provider: m.provider, name: m.name, contextWindow: m.contextWindow }))
	})
}
