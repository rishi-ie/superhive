/**
 * Marketplace page — the /plugins route after the relabel.
 *
 * Phase F T-F-11: header + cards grid + "Open folder" button.
 * Cards come from useTemplates; clicking "Preview" opens
 * the modal (T-F-13).
 *
 * Step 5 rubric: page imports from flows, not from
 * window.api.* or @/api/*.
 */

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { SpinnerIcon, FolderOpenIcon } from '@phosphor-icons/react'
import {
	useTemplates,
	useOpenTemplatesFolder,
} from '@/flows/templates'
import { TemplateCard } from './template-card'
import { TemplatePreviewModal } from './template-preview-modal'
import type { TemplateDetail } from '@/types/electron'

export function MarketplacePage() {
	const { summaries, isLoading, error, getDetail } = useTemplates()
	const { open, isOpening, lastError: openError } = useOpenTemplatesFolder()
	const [previewId, setPreviewId] = useState<string | null>(null)
	const [previewDetail, setPreviewDetail] = useState<TemplateDetail | null>(null)
	const [previewLoading, setPreviewLoading] = useState(false)
	const [previewError, setPreviewError] = useState<string | null>(null)

	async function openPreview(id: string) {
		setPreviewId(id)
		setPreviewDetail(null)
		setPreviewError(null)
		setPreviewLoading(true)
		try {
			const detail = await getDetail(id)
			if (!detail) {
				setPreviewError(`Template "${id}" could not be loaded.`)
			} else {
				setPreviewDetail(detail)
			}
		} catch (err) {
			setPreviewError(err instanceof Error ? err.message : String(err))
		} finally {
			setPreviewLoading(false)
		}
	}

	function closePreview() {
		setPreviewId(null)
		setPreviewDetail(null)
		setPreviewError(null)
	}

	return (
		<div className="flex h-full flex-col">
			<header className="flex items-center justify-between border-b border-border/40 px-6 py-4">
				<div className="flex flex-col">
					<h1 className="text-lg font-semibold text-foreground">Marketplace</h1>
					<p className="text-xs text-muted-foreground">
						Templates project agents spawn regular agents from.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => void open()}
					disabled={isOpening}
				>
					<Icon icon={isOpening ? SpinnerIcon : FolderOpenIcon} className="size-3.5" />
					{isOpening ? 'Opening…' : 'Open folder'}
				</Button>
			</header>

			{(error || openError) && (
				<div className="mx-6 mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
					{error ?? openError}
				</div>
			)}

			<main className="flex-1 overflow-y-auto p-6">
				{isLoading && summaries.length === 0 ? (
					<div className="flex h-full items-center justify-center text-xs text-muted-foreground">
						Loading templates…
					</div>
				) : summaries.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
						<p>No templates installed.</p>
						<p>Drop a template JSON into the templates folder, then refresh.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{summaries.map((s) => (
							<TemplateCard
								key={s.id}
								summary={s}
								onPreview={(id) => void openPreview(id)}
							/>
						))}
					</div>
				)}
			</main>

			<TemplatePreviewModal
				detail={previewDetail}
				isOpen={previewId !== null}
				isLoading={previewLoading}
				error={previewError}
				onClose={closePreview}
			/>
		</div>
	)
}
