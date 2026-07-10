import { ipcMain } from 'electron'
import { SettingsRepository } from '../../src/storage/repositories'
import { IPC } from './index'

const GLOBAL_OWNER_TYPE = 'global' as const
const GLOBAL_OWNER_ID = 'global' as const
const GROUP_PROVIDERS = 'providers' as const
const GROUP_MODELS = 'models' as const

interface ProviderEntry {
	name?: string
	baseUrl?: string | null
	apiKey?: string
}

interface ModelEntry {
	id: string
	provider: string
	name: string
	enabled: boolean
	isCustom?: boolean
}

export function registerSettingsIpc(): void {
	ipcMain.handle(IPC.SETTINGS.GET_PROVIDERS, async () => {
		const rows = await SettingsRepository.getByOwnerAndGroup(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			GROUP_PROVIDERS
		)
		const out: Record<string, ProviderEntry> = {}
		for (const row of rows) {
			out[row.key] = (row.value as ProviderEntry) ?? {}
		}
		return out
	})

	ipcMain.handle(
		IPC.SETTINGS.SET_PROVIDER,
		async (_e, input: { name: string; baseUrl?: string; apiKey?: string }) => {
			const name = input.name?.trim()
			if (!name) throw new Error('Provider name is required')
			const value: ProviderEntry = {
				name,
				baseUrl: input.baseUrl ?? null,
				apiKey: input.apiKey,
			}
			await SettingsRepository.setSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				name,
				value,
				'json',
				name,
				undefined,
				GROUP_PROVIDERS
			)
		}
	)

	ipcMain.handle(IPC.SETTINGS.DELETE_PROVIDER, async (_e, name: string) => {
		await SettingsRepository.removeSetting(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			name
		)
	})

	ipcMain.handle(IPC.SETTINGS.GET_MODELS, async () => {
		const rows = await SettingsRepository.getByOwnerAndGroup(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			GROUP_MODELS
		)
		return rows.map((row) => row.value as ModelEntry)
	})

	ipcMain.handle(
		IPC.SETTINGS.SET_MODEL_ENABLED,
		async (_e, id: string, enabled: boolean) => {
			const existing = await SettingsRepository.getSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				id
			)
			if (!existing) throw new Error(`Model not found: ${id}`)
			const current = existing.value as ModelEntry
			await SettingsRepository.setSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				id,
				{ ...current, enabled },
				'json',
				current.name,
				undefined,
				GROUP_MODELS
			)
		}
	)

	ipcMain.handle(
		IPC.SETTINGS.ADD_MODEL,
		async (_e, input: { provider: string; name: string }) => {
			const provider = input.provider?.trim()
			const name = input.name?.trim()
			if (!provider) throw new Error('Provider is required')
			if (!name) throw new Error('Model name is required')
			const id = `${provider}:${name}`
			await SettingsRepository.setSetting(
				GLOBAL_OWNER_TYPE,
				GLOBAL_OWNER_ID,
				id,
				{ id, provider, name, enabled: true, isCustom: true },
				'json',
				name,
				undefined,
				GROUP_MODELS
			)
		}
	)

	ipcMain.handle(IPC.SETTINGS.DELETE_MODEL, async (_e, id: string) => {
		await SettingsRepository.removeSetting(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			id
		)
	})

	ipcMain.handle(IPC.SETTINGS.GET_ENABLED_MODELS, async () => {
		const rows = await SettingsRepository.getByOwnerAndGroup(
			GLOBAL_OWNER_TYPE,
			GLOBAL_OWNER_ID,
			GROUP_MODELS
		)
		return rows
			.map((row) => row.value as ModelEntry)
			.filter((m) => m.enabled)
			.map((m) => ({ id: m.id, provider: m.provider, name: m.name }))
	})
}