/**
 * TemplatePreviewModal — full template JSON view + copy-to-clipboard.
 *
 * v1 of the marketplace is a "view + copy JSON" modal. Future
 * versions can wire "Use template" to actually start a spawn
 * (out of scope for Phase F).
 *
 * Pretty-prints the template JSON with 2-space indent and
 * provides a clipboard copy button. No syntax highlighting
 * in v1 (acceptable per the plan).
 */

import { useEffect, useMemo, useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CopyIcon, CheckIcon } from '@phosphor-icons/react'
import { Icon } from '@/components/ui/icon'
import type { TemplateDetail } from '@/types/electron'

export interface TemplatePreviewModalProps {
	detail: TemplateDetail | null
	isOpen: boolean
	isLoading: boolean
	error: string | null
	onClose: () => void
}

export function TemplatePreviewModal({
	detail,
	isOpen,
	isLoading,
	error,
	onClose,
}: TemplatePreviewModalProps) {
	const [copied, setCopied] = useState(false)

	useEffect(() => {
		if (!isOpen) setCopied(false)
	}, [isOpen])

	const prettyJson = useMemo(() => {
		if (!detail) return ''
		try {
			return JSON.stringify(detail.raw, null, 2)
		} catch {
			return ''
		}
	}, [detail])

	async function copyJson() {
		if (!prettyJson) return
		try {
			await navigator.clipboard.writeText(prettyJson)
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		} catch {
			// clipboard may not be available (e.g. some Electron
			// contexts); silently fail rather than block the UI
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{detail?.label ?? detail?.id ?? 'Template'}</DialogTitle>
					{detail?.description && (
						<DialogDescription>{detail.description}</DialogDescription>
					)}
				</DialogHeader>

				{isLoading && (
					<div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
						Loading…
					</div>
				)}

				{error && (
					<div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
						{error}
					</div>
				)}

				{detail && !isLoading && !error && (
					<ScrollArea className="h-72 w-full rounded-md border bg-muted/30 p-3">
						<pre className="text-xs leading-relaxed text-foreground/80">
							{prettyJson}
						</pre>
					</ScrollArea>
				)}

				<DialogFooter className="flex items-center justify-between sm:justify-between">
					<span className="text-[10px] text-muted-foreground">
						{detail ? `id: ${detail.id} · v${detail.version}` : ''}
					</span>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={onClose}>
							Close
						</Button>
						<Button
							variant="default"
							size="sm"
							onClick={copyJson}
							disabled={!prettyJson}
						>
							<Icon icon={copied ? CheckIcon : CopyIcon} className="size-3.5" />
							{copied ? 'Copied' : 'Copy JSON'}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
