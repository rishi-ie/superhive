/**
 * known-exts — schema registry mapping ext-truth filenames to their
 * known shape for the Manage tab's dynamic per-extension sections.
 *
 * The truth ext owns the canonical schema (superhive-pi-truth/settings-schema.ts)
 * but lives in a separate npm-installed package, so the renderer can't
 * import its types directly without a build-time dependency. This
 * registry mirrors the SUBSET of each ext's shape that we want the
 * Manage tab to render as a typed form.
 *
 * Today the registry covers the two ext-truth files a coordinator
 * agent can carry (plan ext + spawn ext). New exts add a new entry.
 *
 * Files NOT in this registry render as raw JSON via GenericJsonForm's
 * fallback path. That's deliberate — every new ext ships with a
 * default-form fallback so adding an extension never blocks on
 * updating this file.
 */

import type { Schema } from './GenericJsonForm'

export interface KnownExtEntry {
	/** Human-readable label for the section header. */
	label: string
	/** Short blurb shown under the label. */
	description: string
	/** Schema consumed by GenericJsonForm. Null = always raw JSON. */
	schema: Schema | null
	/** Dotted paths that should be hidden in the form (read-only fields). */
	hiddenFields?: readonly string[]
}

export const KNOWN_EXTS: Record<string, KnownExtEntry> = {
	'superhive-pi-plan': {
		label: 'Plan',
		description: 'Plan mode settings. Changes take effect on the next session restart.',
		schema: {
			planMode: {
				type: 'object',
				label: 'Plan Mode',
				fields: {
					defaultMode: {
						type: 'string',
						label: 'Default Mode',
						enum: ['plan', 'build', 'auto'],
					},
					thinkingLevel: {
						type: 'string',
						label: 'Thinking Level',
						enum: [
							'inherit',
							'off',
							'minimal',
							'low',
							'medium',
							'high',
							'xhigh',
							'max',
						],
					},
				},
			},
		},
	},

	'superhive-pi-spawn': {
		label: 'Spawn',
		description: 'Per-agent spawn ext settings. Toggle the switch in the Extensions section to enable/disable the file.',
		schema: {
			enabled: {
				type: 'boolean',
				label: 'Enabled',
				description: 'Master gate for the spawn_agent LLM tool on this agent.',
			},
			allowedTemplates: {
				type: 'array',
				label: 'Allowed Templates',
				description: 'Optional allowlist. Empty = any template is permitted.',
				itemType: 'string',
				separator: ',',
			},
			requireApproval: {
				type: 'boolean',
				label: 'Require Approval',
				description: 'When true, spawn_agent surfaces a permission ask via append_inbox before creating the agent.',
			},
		},
	},

	'superhive-pi-orchestration': {
		label: 'Orchestration',
		description: 'Project coordination extension settings. Mostly managed by the orchestrator itself; edit with care.',
		schema: null, // Orch ext owns writes; render as raw JSON for inspection only.
		hiddenFields: ['systemPrompt', 'roleFragmentAppended'],
	},
}

export function getKnownExt(fileName: string): KnownExtEntry | null {
	return KNOWN_EXTS[fileName] ?? null
}

export function getAllKnownExts(): ReadonlyArray<[string, KnownExtEntry]> {
	return Object.entries(KNOWN_EXTS)
}
