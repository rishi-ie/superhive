import { expect, test } from 'bun:test'
import { mergeProviders, normalizeRuntimeSettings } from '../provider-merge'

test('does not let blank legacy agent credentials erase global credentials', () => {
	const providers = mergeProviders(
		{ minimax: { name: 'minimax', apiKey: 'global-key', baseUrl: 'https://api.example.test' } },
		{ minimax: { name: 'minimax', apiKey: '', baseUrl: null } },
	)
	expect(providers.minimax).toEqual({
		name: 'minimax',
		apiKey: 'global-key',
		baseUrl: 'https://api.example.test',
	})
})

test('migrates legacy MiniMax settings to Pi native provider routing', () => {
	const settings = normalizeRuntimeSettings({
		model: { provider: 'Minimax', name: 'Minimax-M3' },
		defaultProvider: 'Minimax',
		defaultModel: 'Minimax-M3',
		enabledModels: ['Minimax:Minimax-M3'],
		providers: {
			Minimax: { name: 'Minimax', baseUrl: 'https://api.minimax.io/v1', apiKey: 'key' },
		},
	})
	expect(settings.model).toEqual({ provider: 'minimax', name: 'MiniMax-M3' })
	expect(settings.defaultProvider).toBe('minimax')
	expect(settings.defaultModel).toBe('MiniMax-M3')
	expect(settings.enabledModels).toEqual(['minimax:MiniMax-M3'])
	expect((settings.providers as Record<string, unknown> | undefined)?.minimax).toMatchObject({
		name: 'minimax',
		baseUrl: 'https://api.minimax.io/anthropic',
		apiKey: 'key',
	})
})

test('normalizes a legacy global provider when seeding a brand-new agent', () => {
	const merged = mergeProviders(
		{ Minimax: { name: 'Minimax', baseUrl: 'https://api.minimax.io/v1', apiKey: 'global-key' } },
		{},
	)
	const settings = normalizeRuntimeSettings({
		model: { provider: 'Minimax', name: 'Minimax-M3' },
		defaultProvider: 'Minimax',
		defaultModel: 'Minimax-M3',
		enabledModels: ['Minimax:Minimax-M3'],
		providers: merged,
	})
	expect(settings.providers).toEqual({
		minimax: { name: 'minimax', baseUrl: 'https://api.minimax.io/anthropic', apiKey: 'global-key' },
	})
	expect(settings.model).toEqual({ provider: 'minimax', name: 'MiniMax-M3' })
})
