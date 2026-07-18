/**
 * Tests for the seed helper that picks the "first enabled model" to write
 * into a fresh agent's settings.json.
 *
 * Background: this helper previously only matched against the hardcoded
 * CANON_CATALOG list, so users with custom providers or models outside
 * that list would seed settings.json with empty `model` / `defaultProvider`
 * / `defaultModel` / `enabledModels`. The renderer (via useAgentSettings)
 * would then read those empty fields and the picker would stay on "Select
 * model" — even though Pi could still chat by falling through to its own
 * defaults. The fix: fall back to ANY enabled model when no CANON_CATALOG
 * match exists, while keeping CANON_CATALOG as the preference order so
 * existing users see the same default.
 */

import { describe, expect, mock, test } from 'bun:test'

// Mock SettingsRepository before importing the module under test.
const getByOwnerAndGroupMock = mock(async () => [] as Array<{ key: string; value: unknown }>)

mock.module('../src/storage/repositories', () => ({
	SettingsRepository: {
		getByOwnerAndGroup: getByOwnerAndGroupMock,
	},
}))

// Import after the mock is registered.
const { getTopEnabledModel } = await import('./get-top-enabled-model')

type EnabledRow = { key: string; value: { enabled?: boolean } }

function makeRows(...keys: Array<[string, boolean]>): EnabledRow[] {
	return keys.map(([key, enabled]) => ({ key, value: { enabled } }))
}

function reset(rows: EnabledRow[]): void {
	getByOwnerAndGroupMock.mockReset()
	getByOwnerAndGroupMock.mockImplementation(async () => rows)
}

describe('getTopEnabledModel', () => {
	test('returns null when no models are enabled', async () => {
		reset(makeRows(['anthropic:claude-sonnet-4-5', false], ['openai:gpt-4o', false]))
		expect(await getTopEnabledModel()).toBeNull()
	})

	test('prefers CANON_CATALOG match over first-enabled when both exist', async () => {
		// Custom model is enabled first in the SettingsRepository list, but
		// the CANON_CATALOG match (anthropic) should still win because
		// existing users expect the canon default.
		reset(
			makeRows(
				['customprovider:custom-model', true],
				['anthropic:claude-sonnet-4-5', true],
			),
		)
		expect(await getTopEnabledModel()).toEqual({
			id: 'anthropic:claude-sonnet-4-5',
			provider: 'anthropic',
			name: 'claude-sonnet-4-5',
		})
	})

	test('returns first CANON_CATALOG hit when multiple canon models are enabled', async () => {
		// CANON_CATALOG order: minimax, anthropic, openai, google, deepseek.
		// anthropic comes before openai in CANON_CATALOG, so it wins even
		// though openai appears earlier in the SettingsRepository list.
		reset(
			makeRows(
				['openai:gpt-4o', true],
				['deepseek:deepseek-v3', true],
				['anthropic:claude-sonnet-4-5', true],
			),
		)
		expect(await getTopEnabledModel()).toEqual({
			id: 'anthropic:claude-sonnet-4-5',
			provider: 'anthropic',
			name: 'claude-sonnet-4-5',
		})
	})

	test('falls back to first-enabled when no CANON_CATALOG match exists', async () => {
		// User has only a custom provider enabled. Old behavior: returned null
		// → empty seed → picker stayed on "Select model". New behavior: use
		// the first enabled model regardless of whether its id is canonical.
		reset(makeRows(['customprovider:my-model', true]))
		expect(await getTopEnabledModel()).toEqual({
			id: 'customprovider:my-model',
			provider: 'customprovider',
			name: 'my-model',
		})
	})

	test('handles custom model with provider:model delimiter correctly', async () => {
		reset(makeRows(['acme:acme-pro-v1', true]))
		const result = await getTopEnabledModel()
		expect(result).not.toBeNull()
		expect(result?.provider).toBe('acme')
		expect(result?.name).toBe('acme-pro-v1')
	})

	test('returns null for malformed key without colon delimiter', async () => {
		reset(makeRows(['malformed-key-no-colon', true]))
		expect(await getTopEnabledModel()).toBeNull()
	})

	test('skips disabled rows even when listed before enabled ones', async () => {
		reset(
			makeRows(
				['anthropic:claude-sonnet-4-5', false],
				['openai:gpt-4o', true],
			),
		)
		expect(await getTopEnabledModel()).toEqual({
			id: 'openai:gpt-4o',
			provider: 'openai',
			name: 'gpt-4o',
		})
	})
})
