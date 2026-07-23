/**
 * useExtensionSettings — React flow for any per-extension truth file
 * (e.g. <agentDir>/superhive-pi-plan.json, superhive-pi-orchestration.json,
 * superhive-pi-spawn.json).
 *
 * Phase C: powers the dynamic per-extension sections in the Manage
 * tab (one section per ext-truth file discovered by useTruthFiles).
 *
 * Mirrors useAgentManage's optimistic-state-merge pattern:
 *   - patch(dottedKey, value) merges into the slice's dirty buffer,
 *     optimistically updates slice.state so controlled inputs reflect
 *     the new value immediately (no flicker on next reconciliation),
 *     and writes through truth:write-file after a 50ms debounce.
 *   - flush(patch) does the same but with explicit write-now semantics
 *     (used for save buttons that bypass the debounce).
 *   - reload() re-fetches from disk via truth:read-file.
 *
 * Subscribes to agent:<id>:settings-changed so any external write
 * (truth ext cascade, manual edit, IPC from another consumer) is
 * picked up automatically — the slice reloads on each fire.
 *
 * Multi-instance: each (agentId, extName) pair owns its own slice,
 * indexed in the module-level Map. Disposal happens via
 * disposeExtensionSettingsSliceNow(agentId, extName).
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import { truth } from '@/api/truth'
import { toast } from 'sonner'

export type ExtensionFileState = Record<string, unknown> | null

export interface ExtensionSettingsSlice {
	state: ExtensionFileState
	isLoading: boolean
	error: string | null
	dirty: Record<string, unknown> | null
	debounceTimer: ReturnType<typeof setTimeout> | null
	listeners: Set<() => void>
}

type SliceKey = string // `${agentId}:${extName}`

const slices = new Map<SliceKey, ExtensionSettingsSlice>()
const DEBOUNCE_MS = 50

function sliceKey(agentId: string, extName: string): SliceKey {
	return `${agentId}:${extName}`
}

function ensureSlice(agentId: string, extName: string): ExtensionSettingsSlice {
	const key = sliceKey(agentId, extName)
	const existing = slices.get(key)
	if (existing) return existing
	const slice: ExtensionSettingsSlice = {
		state: null,
		isLoading: false,
		error: null,
		dirty: null,
		debounceTimer: null,
		listeners: new Set(),
	}
	slices.set(key, slice)
	void reloadExtensionSettings(agentId, extName)
	return slice
}

export async function reloadExtensionSettings(agentId: string, extName: string): Promise<void> {
	const key = sliceKey(agentId, extName)
	const slice = slices.get(key)
	if (!slice) return
	slice.isLoading = true
	slice.error = null
	try {
		const result = await truth.readFile(agentId, extName)
		slice.state = result ? (result.content as ExtensionFileState) : null
	} catch (err) {
		slice.error = err instanceof Error ? err.message : `Failed to load ${extName}`
		toast.error(slice.error)
	} finally {
		slice.isLoading = false
		slice.listeners.forEach((l) => l())
	}
}

/**
 * Deep-merge a value at a dotted path into a base object. Mirrors
 * useAgentManage::deepMergeDotted — copy here to keep the flow
 * self-contained (modularity-check.md Step 4: src/api/ thinness).
 */
function deepMergeDotted(base: unknown, dottedKey: string, value: unknown): unknown {
	const segments = dottedKey.split('.')
	if (segments.length === 1) return value
	const root: Record<string, unknown> =
		base && typeof base === 'object' && !Array.isArray(base)
			? { ...(base as Record<string, unknown>) }
			: {}
	let cursor: Record<string, unknown> = root
	for (let i = 0; i < segments.length - 1; i++) {
		const seg = segments[i]!
		const existing = cursor[seg]
		const next: Record<string, unknown> =
			existing && typeof existing === 'object' && !Array.isArray(existing)
				? { ...(existing as Record<string, unknown>) }
				: {}
		cursor[seg] = next
		cursor = next
	}
	cursor[segments[segments.length - 1]!] = value
	return root
}

export function useExtensionSettings(agentId: string | null, extName: string | null) {
	const slice = React.useMemo(() => {
		if (!agentId || !extName) return null
		return ensureSlice(agentId, extName)
	}, [agentId, extName])

	const [state, setState] = React.useState<ExtensionFileState>(null)
	const [isLoading, setIsLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		if (!slice) return
		const sync = () => {
			setState(slice.state)
			setIsLoading(slice.isLoading)
			setError(slice.error)
		}
		sync()
		slice.listeners.add(sync)
		return () => {
			slice.listeners.delete(sync)
		}
	}, [slice])

	// Listen for the runtime settings-changed event so external writes
	// (cascade engine, manual edit) refresh this slice. The runtime
	// debounces + counter-checks per file; we just re-fetch.
	React.useEffect(() => {
		if (!agentId || !extName) return
		const unsub = agents.onSettingsChanged(agentId, () => {
			void reloadExtensionSettings(agentId, extName)
		})
		return () => {
			unsub()
		}
	}, [agentId, extName])

	const patch = React.useCallback((key: string, value: unknown) => {
		if (!agentId || !extName) return
		const key2 = sliceKey(agentId, extName)
		const cur = slices.get(key2)
		if (!cur) return
		if (!cur.dirty) cur.dirty = {}
		const merged = deepMergeDotted(cur.dirty, key, value)
		if (merged && typeof merged === 'object' && !Array.isArray(merged)) {
			for (const [k, v] of Object.entries(merged as Record<string, unknown>)) {
				cur.dirty[k] = v
			}
		}
		if (cur.state) {
			cur.state = deepMergeDotted(cur.state, key, value) as ExtensionFileState
		}
		if (cur.debounceTimer) clearTimeout(cur.debounceTimer)
		cur.debounceTimer = setTimeout(async () => {
			const sliceNow = slices.get(key2)
			if (!sliceNow || !sliceNow.dirty || Object.keys(sliceNow.dirty).length === 0) return
			const p = sliceNow.dirty
			sliceNow.dirty = null
			sliceNow.debounceTimer = null
			try {
				await truth.writeFile(agentId, { extName, patch: p })
				await reloadExtensionSettings(agentId, extName)
			} catch (err) {
				toast.error(err instanceof Error ? err.message : `Failed to save ${extName}`)
			}
		}, DEBOUNCE_MS)
		cur.listeners.forEach((l) => l())
	}, [agentId, extName])

	const flush = React.useCallback(async (p: Record<string, unknown>) => {
		if (!agentId || !extName) return
		const key2 = sliceKey(agentId, extName)
		const sliceNow = slices.get(key2)
		if (!sliceNow) return
		if (sliceNow.debounceTimer) {
			clearTimeout(sliceNow.debounceTimer)
			sliceNow.debounceTimer = null
		}
		const merged: Record<string, unknown> = sliceNow.dirty
			? { ...sliceNow.dirty, ...p }
			: { ...p }
		if (sliceNow.state) {
			for (const [k, v] of Object.entries(merged)) {
				sliceNow.state = deepMergeDotted(sliceNow.state, k, v) as ExtensionFileState
			}
		}
		sliceNow.dirty = null
		if (Object.keys(merged).length === 0) return
		try {
			await truth.writeFile(agentId, { extName, patch: merged })
			await reloadExtensionSettings(agentId, extName)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : `Failed to save ${extName}`)
		}
	}, [agentId, extName])

	const reload = React.useCallback(async () => {
		if (!agentId || !extName) return
		await reloadExtensionSettings(agentId, extName)
	}, [agentId, extName])

	return { settings: state, isLoading, error, patch, flush, reload }
}

export function disposeExtensionSettingsSliceNow(agentId: string, extName: string): void {
	const key = sliceKey(agentId, extName)
	const slice = slices.get(key)
	if (!slice) return
	if (slice.debounceTimer) clearTimeout(slice.debounceTimer)
	slices.delete(key)
}
