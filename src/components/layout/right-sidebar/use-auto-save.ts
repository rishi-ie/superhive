import { useCallback, useEffect, useRef } from 'react'
import { updateAgentManage } from '@/flows/agents/settings/update-agent-settings'
import type { AutoSaveHandle } from '@/models/component'

/**
 * Expand a dotted key (`"catalog.extensions"`) into a nested object
 * (`{ catalog: { extensions: ... } }`). The settings IPC writer does a
 * shallow `{...prev, ...patch}` merge, so passing the dotted key as a
 * literal top-level key would store it as `"catalog.extensions"` and
 * the next read would silently drop it. Expanding into nested paths
 * lets the shallow merge land at the correct depth.
 */
function expandDottedKey(key: string, value: unknown): Record<string, unknown> {
  const segments = key.split('.')
  if (segments.length === 1) return { [key]: value }
  const root: Record<string, unknown> = {}
  let cursor: Record<string, unknown> = root
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!
    const next: Record<string, unknown> = {}
    cursor[seg] = next
    cursor = next
  }
  cursor[segments[segments.length - 1]!] = value
  return root
}

export function useAutoSave(agentId: string | null): AutoSaveHandle {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const pendingRef = useRef<Record<string, unknown> | null>(null)

	const patch = useCallback((key: string, value: unknown) => {
		if (!agentId) return
		if (timerRef.current) clearTimeout(timerRef.current)
		if (!pendingRef.current) pendingRef.current = {}
		Object.assign(pendingRef.current, expandDottedKey(key, value))
		timerRef.current = setTimeout(async () => {
			const p = pendingRef.current
			pendingRef.current = null
			timerRef.current = null
			if (!p || Object.keys(p).length === 0) return
			await updateAgentManage({ agentId, patch: p })
		}, 300)
	}, [agentId])

	const flush = useCallback(async (p: Record<string, unknown>) => {
		if (!agentId) return
		if (timerRef.current) {
			clearTimeout(timerRef.current)
			timerRef.current = null
		}
		// Merge the explicit `p` into any pending patch so we don't drop work.
		const merged: Record<string, unknown> = pendingRef.current
			? { ...pendingRef.current, ...p }
			: { ...p }
		pendingRef.current = null
		if (Object.keys(merged).length === 0) return
		await updateAgentManage({ agentId, patch: merged })
	}, [agentId])

	// Flush on unmount so unsaved patches don't disappear.
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current)
				const p = pendingRef.current
				if (p && Object.keys(p).length > 0) {
					void updateAgentManage({ agentId: agentId ?? '', patch: p })
				}
			}
		}
	}, [agentId])

	return { patch, flush }
}
