/**
 * TemplateCard — single card on the marketplace grid.
 *
 * Renders the summary shape (Phase F T-F-12). Clicking "Preview"
 * opens the modal (T-F-13). The card shows:
 *   - icon (resolved by name; falls back to PuzzlePieceIcon)
 *   - label
 *   - description
 *   - category badge (if present)
 *
 * No copy-to-clipboard in v1 — that's the modal's job.
 */

import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	PuzzlePieceIcon,
	BookOpenTextIcon,
	ChartLineUpIcon,
	HandIcon,
	CodeIcon,
	FolderIcon,
	type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import type { TemplateSummary } from '@/types/electron'

const ICON_MAP: Record<string, PhosphorIcon> = {
	BookOpenTextIcon,
	ChartLineUpIcon,
	HandIcon,
	CodeIcon,
	FolderIcon,
}

function resolveIcon(name: string | undefined): PhosphorIcon {
	if (!name) return PuzzlePieceIcon
	return ICON_MAP[name] ?? PuzzlePieceIcon
}

export interface TemplateCardProps {
	summary: TemplateSummary
	onPreview: (id: string) => void
}

export function TemplateCard({ summary, onPreview }: TemplateCardProps) {
	const IconComponent = resolveIcon(summary.icon)
	return (
		<Card className="flex flex-col">
			<CardHeader>
				<div className="flex items-start justify-between gap-2">
					<div className="flex items-center gap-2">
						<Icon icon={IconComponent} className="size-5 text-muted-foreground" />
						<CardTitle className="text-base">{summary.label}</CardTitle>
					</div>
					{summary.category && (
						<Badge variant="secondary" className="text-[10px]">
							{summary.category}
						</Badge>
					)}
				</div>
				{summary.description && (
					<CardDescription className="line-clamp-3 text-xs">
						{summary.description}
					</CardDescription>
				)}
			</CardHeader>
			<CardContent className="mt-auto">
				<Button
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() => onPreview(summary.id)}
				>
					Preview
				</Button>
			</CardContent>
		</Card>
	)
}
