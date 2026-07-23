/**
 * useOpenTemplatesFolder — wraps templates:open-folder.
 *
 * Opens the user's templates directory in the system file
 * explorer. The main process creates the directory if it
 * doesn't exist.
 *
 * Step 5 rubric: this flow owns the IPC call. The "Open
 * folder" button on the marketplace page calls this hook.
 */

import { useCallback, useState } from 'react'
import { templates } from '@/api/templates'

export interface UseOpenTemplatesFolderResult {
	open: () => Promise<void>
	isOpening: boolean
	lastError: string | null
}

export function useOpenTemplatesFolder(): UseOpenTemplatesFolderResult {
	const [isOpening, setIsOpening] = useState(false)
	const [lastError, setLastError] = useState<string | null>(null)

	const open = useCallback(async () => {
		setIsOpening(true)
		setLastError(null)
		try {
			await templates.openFolder()
		} catch (err) {
			setLastError(err instanceof Error ? err.message : String(err))
		} finally {
			setIsOpening(false)
		}
	}, [])

	return { open, isOpening, lastError }
}
