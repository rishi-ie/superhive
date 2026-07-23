/**
 * useTruthFiles — React flow for `truth:list-files`.
 *
 * Phase C: powers the Manage tab's dynamic per-extension sections.
 * Returns the list of truth files for an agent (4 canonical +
 * N per-extension files), refreshed on demand and via the
 * agent:<id>:settings-changed event.
 */

import * as React from 'react'
import { agents } from '@/api/agents'
import { truth } from '@/api/truth'
import type { TruthFileEntry } from '@/types/electron'

export interface UseTruthFilesResult {
	files: TruthFileEntry[]
	isLoading: boolean
	error: string | null
	reload: () => Promise<void>
}

export function useTruthFiles(agentId: string | null): UseTruthFilesResult {
	const [files, setFiles] = React.useState<TruthFileEntry[]>([])
	const [isLoading, setIsLoading] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const reload = React.useCallback(async () => {
		if (!agentId) return
		setIsLoading(true)
		setError(null)
		try {
			const result = await truth.listFiles(agentId)
			setFiles(result)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to list truth files')
		} finally {
			setIsLoading(false)
		}
	}, [agentId])

	React.useEffect(() => {
		if (!agentId) {
			setFiles([])
			return
		}
		void reload()
	}, [agentId, reload])

	// External writes (cascade, manual edit) auto-refresh the list.
	// Cheap: one readdir + 4 stats. Same event useExtensionSettings
	// listens on.
	React.useEffect(() => {
		if (!agentId) return
		const unsub = agents.onSettingsChanged(agentId, () => {
			void reload()
		})
		return () => {
			unsub()
		}
	}, [agentId, reload])

	return { files, isLoading, error, reload }
}
