/**
 * GenericJsonForm — schema-driven form renderer for ext-truth files.
 *
 * Phase C: powers the Manage tab's dynamic per-extension sections.
 * Walks a JSON value + a FieldSchema tree and renders an editor:
 *
 *   { type: 'boolean' }       → <Switch>
 *   { type: 'string' }        → <Input>
 *   { type: 'string', enum }  → segmented dropdown
 *   { type: 'number' }        → <Input type="number">
 *   { type: 'array' }         → comma-separated <Input>
 *   { type: 'object', fields }→ nested fields with auto-stamping
 *
 * Unknown shapes (no schema OR schema returns null) fall back to a
 * raw JSON <Textarea>. The textarea path always shows the full
 * content even when a partial schema is provided, so the user can
 * still edit values the schema doesn't model.
 *
 * Writes flow through `onPatch(dottedKey, value)`. The caller owns
 * the debounce + persistence (via useExtensionSettings.flush).
 *
 * Depth cap: nested `object` fields render down to depth 4. Beyond
 * that we fall back to a JSON textarea for that subtree to keep
 * the form bounded.
 */

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

export type FieldSchema =
	| { type: 'boolean'; label?: string; description?: string }
	| { type: 'string'; label?: string; description?: string; enum?: readonly string[] }
	| { type: 'number'; label?: string; description?: string }
	| { type: 'array'; label?: string; description?: string; itemType?: 'string' | 'number'; separator?: string }
	| { type: 'object'; label?: string; description?: string; fields: Schema }

export type Schema = Record<string, FieldSchema>

export interface GenericJsonFormProps {
	value: Record<string, unknown>
	schema: Schema | null
	onPatch: (dottedKey: string, value: unknown) => void
}

const MAX_DEPTH = 4
const UNKNOWN_HINT =
	'This ext-truth file has no schema entry in known-exts.ts. Editing raw JSON below; save commits the entire object.'

export function GenericJsonForm({ value, schema, onPatch }: GenericJsonFormProps) {
	const [rawMode, setRawMode] = React.useState(false)
	const [rawDraft, setRawDraft] = React.useState<string>(() => JSON.stringify(value, null, 2))

	// Re-sync the textarea draft when the upstream value changes
	// (e.g. external reload). Only when in raw mode.
	React.useEffect(() => {
		if (rawMode) setRawDraft(JSON.stringify(value, null, 2))
	}, [value, rawMode])

	if (!schema || Object.keys(schema).length === 0 || rawMode) {
		return (
			<div className="flex flex-col gap-stack">
				{!schema && (
					<p className="text-xs text-sidebar-foreground/60">{UNKNOWN_HINT}</p>
				)}
				<Textarea
					value={rawDraft}
					onChange={(e) => setRawDraft(e.target.value)}
					rows={Math.min(20, Math.max(6, Object.keys(value).length + 4))}
					className="font-mono text-xs bg-input/30 border-sidebar-border text-sidebar-foreground"
				/>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
						onClick={() => setRawMode(false)}
						disabled={!schema}
					>
						{schema ? 'Back to schema form' : 'Edit raw JSON'}
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-stack">
			{Object.entries(schema).map(([key, field]) => (
				<FieldRow
					key={key}
					fieldKey={key}
					field={field}
					value={value[key]}
					depth={1}
					onPatch={onPatch}
				/>
			))}
			<div className="flex justify-end">
				<button
					type="button"
					className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"
					onClick={() => setRawMode(true)}
				>
					Edit raw JSON
				</button>
			</div>
		</div>
	)
}

interface FieldRowProps {
	fieldKey: string
	field: FieldSchema
	value: unknown
	depth: number
	onPatch: (dottedKey: string, value: unknown) => void
}

function FieldRow({ fieldKey, field, value, depth, onPatch }: FieldRowProps) {
	const label = field.label ?? fieldKey
	const dotted = fieldKey

	switch (field.type) {
		case 'boolean':
			return (
				<div className="flex items-center justify-between gap-stack">
					<Label className="text-xs text-sidebar-foreground">{label}</Label>
					<Switch
						checked={Boolean(value)}
						onCheckedChange={(v) => onPatch(dotted, v)}
					/>
				</div>
			)

		case 'number': {
			const num = typeof value === 'number' ? value : value === '' || value == null ? '' : Number(value)
			return (
				<div className="flex flex-col gap-stack-tight">
					<Label className="text-xs text-sidebar-foreground">{label}</Label>
					<Input
						type="number"
						value={num}
						onChange={(e) => {
							const raw = e.target.value
							if (raw === '') {
								onPatch(dotted, null)
								return
							}
							const n = Number(raw)
							if (Number.isFinite(n)) onPatch(dotted, n)
						}}
						className="font-mono text-xs bg-input/30 border-sidebar-border text-sidebar-foreground"
					/>
					{field.description && (
						<span className="text-xs text-sidebar-foreground/50">{field.description}</span>
					)}
				</div>
			)
		}

		case 'string': {
			if (field.enum && field.enum.length > 0) {
				const current = typeof value === 'string' ? value : (field.enum[0] ?? '')
				return (
					<div className="flex flex-col gap-stack-tight">
						<Label className="text-xs text-sidebar-foreground">{label}</Label>
						<EnumPicker
							value={current}
							options={field.enum}
							onChange={(v) => onPatch(dotted, v)}
						/>
						{field.description && (
							<span className="text-xs text-sidebar-foreground/50">{field.description}</span>
						)}
					</div>
				)
			}
			return (
				<div className="flex flex-col gap-stack-tight">
					<Label className="text-xs text-sidebar-foreground">{label}</Label>
					<Input
						type="text"
						value={typeof value === 'string' ? value : value == null ? '' : String(value)}
						onChange={(e) => onPatch(dotted, e.target.value)}
						className="font-mono text-xs bg-input/30 border-sidebar-border text-sidebar-foreground"
					/>
					{field.description && (
						<span className="text-xs text-sidebar-foreground/50">{field.description}</span>
					)}
				</div>
			)
		}

		case 'array': {
			const sep = field.separator ?? ','
			const arr = Array.isArray(value) ? value : []
			const display = arr.join(sep)
			return (
				<div className="flex flex-col gap-stack-tight">
					<Label className="text-xs text-sidebar-foreground">{label}</Label>
					<Input
						type="text"
						value={display}
						placeholder={`Comma-separated (e.g. a${sep}b${sep}c)`}
						onChange={(e) => {
							const raw = e.target.value
							if (raw === '') {
								onPatch(dotted, [])
								return
							}
							const parts = raw.split(sep).map((s) => s.trim()).filter((s) => s.length > 0)
							if (field.itemType === 'number') {
								const nums = parts.map(Number).filter((n) => Number.isFinite(n))
								onPatch(dotted, nums)
							} else {
								onPatch(dotted, parts)
							}
						}}
						className="font-mono text-xs bg-input/30 border-sidebar-border text-sidebar-foreground"
					/>
					{field.description && (
						<span className="text-xs text-sidebar-foreground/50">{field.description}</span>
					)}
				</div>
			)
		}

		case 'object': {
			if (depth >= MAX_DEPTH) {
				return (
					<div className="flex flex-col gap-stack-tight">
						<Label className="text-xs text-sidebar-foreground">{label}</Label>
						<Textarea
							value={JSON.stringify(value ?? {}, null, 2)}
							rows={4}
							onChange={(e) => {
								try {
									const parsed = JSON.parse(e.target.value)
									onPatch(dotted, parsed)
								} catch {
									// swallow parse errors — user is mid-typing
								}
							}}
							className="font-mono text-xs bg-input/30 border-sidebar-border text-sidebar-foreground"
						/>
						<span className="text-xs text-sidebar-foreground/50">
							(depth limit reached — edit as JSON)
						</span>
					</div>
				)
			}
			const obj = (value && typeof value === 'object' && !Array.isArray(value))
				? (value as Record<string, unknown>)
				: {}
			return (
				<div className="flex flex-col gap-stack-tight">
					<Label className="text-xs text-sidebar-foreground">{label}</Label>
					<div className="flex flex-col gap-stack rounded-button border border-sidebar-border/60 bg-input/10 p-stack-tight">
						{Object.entries(field.fields).map(([subKey, subField]) => (
							<FieldRow
								key={subKey}
								fieldKey={`${dotted}.${subKey}`}
								field={subField}
								value={obj[subKey]}
								depth={depth + 1}
								onPatch={onPatch}
							/>
						))}
					</div>
				</div>
			)
		}
	}
}

interface EnumPickerProps {
	value: string
	options: readonly string[]
	onChange: (value: string) => void
}

/**
 * Inline segmented picker for short enums (≤ 6 options). Falls back
 * to a Select dropdown for longer lists. No external dep — the plan
 * ext's planMode is the only known caller today and it ships 3
 * values per picker.
 */
function EnumPicker({ value, options, onChange }: EnumPickerProps) {
	if (options.length <= 6) {
		return (
			<div className="inline-flex rounded-button border border-sidebar-border bg-input/20 p-0.5">
				{options.map((opt) => {
					const active = opt === value
					return (
						<button
							key={opt}
							type="button"
							className={
								active
									? 'rounded-button-sm px-2 py-0.5 text-xs font-medium bg-sidebar-foreground/10 text-sidebar-foreground'
									: 'rounded-button-sm px-2 py-0.5 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground'
							}
							onClick={() => onChange(opt)}
						>
							{opt}
						</button>
					)
				})}
			</div>
		)
	}
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="h-8 rounded-button border border-sidebar-border bg-input/30 px-2 font-mono text-xs text-sidebar-foreground"
		>
			{options.map((opt) => (
				<option key={opt} value={opt}>
					{opt}
				</option>
			))}
		</select>
	)
}
