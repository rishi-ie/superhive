import { useCallback } from 'react'
import { updateAgentManage } from '@/flows/agents/settings/update-agent-settings'
import type { AutoSaveHandle } from '@/models/component'

/**
 * useAutoSave — immediate-write hook for the agent panel's Manage tab.
 *
 * Writes fire the moment `patch(key, value)` is called. The main
 * process's deep-merge + 3-attempt retry loop handles correctness,
 * so no renderer-side debounce is needed. Text inputs add a
 * per-component 250ms debounce in their `onChange` so rapid typing
 * doesn't trigger one IPC per keystroke.
 *
 * Dotted keys are passed as a single top-level object now that
 * the main process deep-merges. The old `expandDottedKey` helper
 * is gone — it only existed to work around the shallow merge.
 */
export function useAutoSave(agentId: string | null): AutoSaveHandle {
	const patch = useCallback(
		(key: string, value: unknown) => {
			if (!agentId) return
			// Build the top-level partial patch
			// (e.g. "behavior.autoCompaction" -> { behavior: { autoCompaction: false } }).
			// The main process deep-merges this into the current file,
			// so sibling keys are preserved.
			const segments = key.split('.')
			const partial: Record<string, unknown> = {}
			if (segments.length === 1) {
				partial[key] = value
			} else {
				let cursor: Record<string, unknown> = partial
				for (let i = 0; i < segments.length - 1; i++) {
					const seg = segments[i]!
					const next: Record<string, unknown> = {}
					cursor[seg] = next
					cursor = next
				}
				cursor[segments[segments.length - 1]!] = value
			}
			void updateAgentManage({ agentId, patch: partial })
		},
		[agentId],
	)

	return { patch }
}
