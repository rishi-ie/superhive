/**
 * useProjectAgentDefaults — fetches the bundled project-agent defaults
 * (base + overlays) from the main process for renderer-side use.
 *
 * The CreateProjectDialog uses this to render the category picker with
 * live preview of each overlay's systemPromptAddition. The marketplace
 * page (Phase F) and orchestration extension (Phase B) will reuse the
 * IPC channel directly without this hook.
 *
 * No cache — the dialog is short-lived and the file is small (~2KB).
 */

import * as React from 'react'
import { defaults as defaultsApi } from '@/api/defaults'
import type { ProjectAgentDefaults } from '@/types/electron'

export interface UseProjectAgentDefaultsResult {
	defaults: ProjectAgentDefaults | null
	loading: boolean
	error: string | null
}

export function useProjectAgentDefaults(enabled: boolean): UseProjectAgentDefaultsResult {
	const [state, setState] = React.useState<UseProjectAgentDefaultsResult>({
		defaults: null,
		loading: false,
		error: null,
	})

	React.useEffect(() => {
		if (!enabled) return

		let cancelled = false
		setState({ defaults: null, loading: true, error: null })

		defaultsApi
			.get()
			.then((result) => {
				if (cancelled) return
				if (result) {
					setState({ defaults: result, loading: false, error: null })
				} else {
					setState({
						defaults: null,
						loading: false,
						error: 'Defaults file missing. Restart the app to populate it.',
					})
				}
			})
			.catch((err: unknown) => {
				if (cancelled) return
				setState({
					defaults: null,
					loading: false,
					error: err instanceof Error ? err.message : 'Failed to read defaults',
				})
			})

		return () => {
			cancelled = true
		}
	}, [enabled])

	return state
}
