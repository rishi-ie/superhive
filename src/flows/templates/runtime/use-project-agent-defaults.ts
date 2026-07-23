/**
 * useProjectAgentDefaults — wraps defaults:get.
 *
 * Reads the bundled project-agent-defaults.json from the
 * user's Superhive home. Used by:
 *   - CreateProjectDialog (Phase A) — to render the category
 *     picker with per-overlay preview text
 *   - Marketplace page (Phase F) — to show category metadata
 *     on each template card
 *   - Orchestration extension (Phase B) — to read overlays
 *     at session_start (in-process, no IPC)
 *
 * Step 5 rubric: this flow owns the IPC call.
 */

import { useCallback, useEffect, useState } from 'react'
import { defaults } from '@/api/defaults'
import type { ProjectAgentDefaults } from '@/types/electron'

export interface UseProjectAgentDefaultsResult {
	defaults: ProjectAgentDefaults | null
	isLoading: boolean
	error: string | null
	reload: () => Promise<void>
}

export function useProjectAgentDefaults(): UseProjectAgentDefaultsResult {
	const [data, setData] = useState<ProjectAgentDefaults | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const reload = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const out = await defaults.get()
			setData(out)
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err))
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		void reload()
	}, [reload])

	return { defaults: data, isLoading, error, reload }
}
