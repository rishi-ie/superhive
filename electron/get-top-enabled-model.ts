/**
 * Seed helper: pick the "first enabled model" to write into a fresh agent's
 * `Superhive-pi-<name>.json` so the new agent has a model selected without
 * the user having to pick one manually.
 *
 * Resolution order:
 *   1. The first CANON_CATALOG model that is enabled (preference order:
 *      minimax, anthropic, openai, google, deepseek). This preserves the
 *      previous behavior for users who had any canon model enabled.
 *   2. Otherwise, the first enabled model by `enabled` ordering. This
 *      covers users whose only enabled models are custom providers or
 *      models not in CANON_CATALOG — previously these users got an empty
 *      seed and the picker stayed on "Select model" forever, even though
 *      Pi could still chat by falling through to its own defaults.
 *
 * Returns null when no model is enabled, or when the fallback key lacks
 * a `:` delimiter (malformed key, can't parse provider/name).
 */

import { SettingsRepository } from '../src/storage/repositories'

export const CANON_CATALOG = [
	'minimax:MiniMax-Text-01',
	'anthropic:claude-sonnet-4-5',
	'openai:gpt-4o',
	'google:gemini-2-5-pro',
	'deepseek:deepseek-v3',
] as const

export async function getTopEnabledModel(): Promise<{ id: string; provider: string; name: string } | null> {
	const rows = await SettingsRepository.getByOwnerAndGroup('global', 'global', 'models')
	const enabled = rows.filter((r) => {
		const v = r.value as { enabled?: boolean }
		return v?.enabled === true
	})
	if (enabled.length === 0) return null
	// Prefer CANON_CATALOG order so existing users see the same default.
	for (const id of CANON_CATALOG) {
		if (enabled.some((r) => r.key === id)) {
			const colonIdx = id.indexOf(':')
			return {
				id,
				provider: id.slice(0, colonIdx),
				name: id.slice(colonIdx + 1),
			}
		}
	}
	// Fallback: any enabled model, even one whose id isn't in CANON_CATALOG.
	const first = enabled[0]
	if (!first) return null
	const colonIdx = first.key.indexOf(':')
	if (colonIdx < 0) return null
	return {
		id: first.key,
		provider: first.key.slice(0, colonIdx),
		name: first.key.slice(colonIdx + 1),
	}
}
