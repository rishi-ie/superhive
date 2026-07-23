/**
 * DynamicExtSection — renders a single per-extension truth file as a
 * section in the Manage tab.
 *
 * Phase C: used by ProjectSettingsPanel to render one section per
 * <agentDir>/<ext-name>.json discovered via useTruthFiles. Section
 * header comes from KNOWN_EXTS (label + description); the body is
 * a GenericJsonForm bound to useExtensionSettings.patch / flush.
 *
 * Schema mode (KNOWN_EXTS has a schema entry): writes auto-debounce
 * at 50ms through useExtensionSettings.patch. No save button.
 *
 * Raw mode (KNOWN_EXTS has no schema, or user clicked "Edit raw
 * JSON"): an explicit Save button commits the textarea content via
 * useExtensionSettings.flush.
 *
 * Fallback (file is missing on disk): render a hint explaining that
 * the cascade engine will create the file when the ext is enabled
 * in the Extensions section.
 */

import * as React from 'react'
import { useExtensionSettings } from '@/flows/agents/settings'
import { getKnownExt } from './known-exts'
import { GenericJsonForm } from './GenericJsonForm'
import { Button } from '@/components/ui/button'

export interface DynamicExtSectionProps {
	agentId: string
	extName: string
	fileName: string
}

export function DynamicExtSection({ agentId, extName, fileName }: DynamicExtSectionProps) {
	const entry = getKnownExt(fileName)
	const { settings, isLoading, error, patch, flush, reload } = useExtensionSettings(agentId, extName)
	const [rawDraft, setRawDraft] = React.useState<string>('')
	const [rawDirty, setRawDirty] = React.useState(false)

	// Sync the raw textarea when settings reload from disk.
	React.useEffect(() => {
		if (settings) setRawDraft(JSON.stringify(settings, null, 2))
	}, [settings])

	const label = entry?.label ?? humanize(fileName)
	const description = entry?.description ?? ''

	// Missing file case
	if (!isLoading && settings === null) {
		return (
			<section className="flex flex-col gap-stack border-t border-sidebar-border pt-stack-loose">
				<header className="flex flex-col gap-stack-tight">
					<h3 className="text-sm font-medium text-sidebar-foreground">{label}</h3>
					{description && (
						<p className="text-xs text-sidebar-foreground/60">{description}</p>
					)}
				</header>
				<p className="text-xs text-sidebar-foreground/50 italic">
					No <code className="font-mono">{fileName}</code> on disk yet. The cascade
					engine will create it when this extension is enabled in the
					Extensions section above.
				</p>
			</section>
		)
	}

	if (error && !settings) {
		return (
			<section className="flex flex-col gap-stack border-t border-sidebar-border pt-stack-loose">
				<header className="flex flex-col gap-stack-tight">
					<h3 className="text-sm font-medium text-sidebar-foreground">{label}</h3>
				</header>
				<p role="alert" className="text-xs text-destructive">
					{error}
				</p>
				<Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
					Retry
				</Button>
			</section>
		)
	}

	if (isLoading || !settings) {
		return (
			<section className="flex flex-col gap-stack border-t border-sidebar-border pt-stack-loose">
				<header className="flex flex-col gap-stack-tight">
					<h3 className="text-sm font-medium text-sidebar-foreground">{label}</h3>
				</header>
				<p className="text-xs text-sidebar-foreground/50">Loading…</p>
			</section>
		)
	}

	// Raw-mode save handler — parse the textarea and flush.
	const handleRawSave = async () => {
		try {
			const parsed = JSON.parse(rawDraft)
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				throw new Error('Must be a JSON object')
			}
			await flush(parsed as Record<string, unknown>)
			setRawDirty(false)
		} catch (err) {
			// Re-throw with a clearer message; the user sees a toast
			throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : String(err)}`)
		}
	}

	const onRawDraftChange = (next: string) => {
		setRawDraft(next)
		setRawDirty(next !== JSON.stringify(settings, null, 2))
	}

	return (
		<section className="flex flex-col gap-stack border-t border-sidebar-border pt-stack-loose">
			<header className="flex flex-col gap-stack-tight">
				<div className="flex items-center justify-between gap-stack">
					<h3 className="text-sm font-medium text-sidebar-foreground">{label}</h3>
					<span className="text-[10px] font-mono text-sidebar-foreground/40">
						{extName}.json
					</span>
				</div>
				{description && (
					<p className="text-xs text-sidebar-foreground/60">{description}</p>
				)}
			</header>

			{entry?.schema ? (
				<GenericJsonForm
					value={settings}
					schema={entry.schema}
					onPatch={(k, v) => patch(k, v)}
				/>
			) : (
				<div className="flex flex-col gap-stack-tight">
					<textarea
						value={rawDraft}
						onChange={(e) => onRawDraftChange(e.target.value)}
						rows={Math.min(20, Math.max(6, Object.keys(settings).length + 4))}
						className="w-full rounded-button border border-sidebar-border bg-input/30 px-2 py-1 font-mono text-xs text-sidebar-foreground"
					/>
					{rawDirty && (
						<p className="text-xs text-sidebar-foreground/50 italic">
							Unsaved changes.
						</p>
					)}
				</div>
			)}

			{/* Raw-mode save button (only when no schema). Schema mode
			    auto-saves via patch debounce. */}
			{!entry?.schema && rawDirty && (
				<div className="flex justify-end">
					<Button
						type="button"
						size="sm"
						onClick={() => void handleRawSave().catch(() => undefined)}
					>
						Save
					</Button>
				</div>
			)}
		</section>
	)
}

/**
 * Fallback label for unknown extensions. e.g.
 * "superhive-pi-foo" → "Superhive Pi Foo".
 */
function humanize(fileName: string): string {
	const stem = fileName.replace(/\.json$/, '')
	if (stem.startsWith('superhive-pi-')) {
		return `Superhive Pi ${capitalize(stem.slice('superhive-pi-'.length))}`
	}
	return capitalize(stem.replace(/[-_]+/g, ' '))
}

function capitalize(s: string): string {
	if (!s) return s
	return s[0]!.toUpperCase() + s.slice(1)
}
