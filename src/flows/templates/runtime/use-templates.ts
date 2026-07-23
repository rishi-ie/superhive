/**
 * useTemplates — wraps templates:list + templates:get.
 *
 * Loads the summary list on mount and exposes a loader for
 * the preview modal. Designed for the marketplace page
 * (Phase F T-F-11).
 *
 * Step 5 rubric: this flow owns the IPC call. Components
 * never import from window.api.* directly.
 */

import { useCallback, useEffect, useState } from 'react'
import { templates } from '@/api/templates'
import type { TemplateDetail, TemplateSummary } from '@/types/electron'

export interface UseTemplatesResult {
	summaries: TemplateSummary[]
	isLoading: boolean
	error: string | null
	reload: () => Promise<void>
	getDetail: (id: string) => Promise<TemplateDetail | null>
}

export function useTemplates(): UseTemplatesResult {
	const [summaries, setSummaries] = useState<TemplateSummary[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const reload = useCallback(async () => {
		setIsLoading(true)
		setError(null)
		try {
			const out = await templates.list()
			setSummaries(out)
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err))
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		void reload()
	}, [reload])

	const getDetail = useCallback(
		async (id: string): Promise<TemplateDetail | null> => {
			try {
				return await templates.get(id)
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err)
				setError(msg)
				return null
			}
		},
		[],
	)

	return { summaries, isLoading, error, reload, getDetail }
}
