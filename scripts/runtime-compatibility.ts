import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Bump when a prepared runtime needs a one-time compatibility refresh. */
export const RUNTIME_COMPATIBILITY_VERSION = 3

function replaceRequired(path: string, from: string, to: string, already = to): void {
	const source = readFileSync(path, 'utf8')
	if (source.includes(already)) return
	if (!source.includes(from)) {
		throw new Error(`Cannot apply runtime compatibility patch: expected source is missing in ${path}`)
	}
	writeFileSync(path, source.replace(from, to), 'utf8')
}

/**
 * The pinned truth extension predates Pi's native MiniMax provider. Pi now
 * exposes MiniMax through Anthropic Messages at /anthropic, not OpenAI
 * Completions at /v1. Keep the prepared extension compatible until its pin
 * includes this upstream correction.
 */
export function applyRuntimeCompatibility(runtimeRoot: string): void {
	const truthRoot = join(runtimeRoot, 'extensions', 'superhive-pi-truth')
	const providerMap = join(truthRoot, 'provider-map.ts')
	const applier = join(truthRoot, 'applier.ts')
	const index = join(truthRoot, 'index.ts')
	if (!existsSync(providerMap) || !existsSync(applier) || !existsSync(index)) {
		throw new Error(`Missing superhive-pi-truth runtime files under ${truthRoot}`)
	}

	replaceRequired(providerMap, 'minimax: "openai-completions"', 'minimax: "anthropic-messages"')
	replaceRequired(providerMap, 'return PROVIDER_API[name] ?? "openai-completions"', 'return PROVIDER_API[name.toLowerCase()] ?? "openai-completions"')
	replaceRequired(applier, 'const ok = await applyModel(next.model, ctx);', 'const ok = await applyModel(next.model, next.providers, ctx);')
	replaceRequired(
		applier,
		'export async function applyModel(target: SettingsFile["model"], ctx: ApplyContext): Promise<boolean> {',
		'export async function applyModel(target: SettingsFile["model"], providers: SettingsFile["providers"] | undefined, ctx: ApplyContext): Promise<boolean> {',
	)
	replaceRequired(applier, 'baseUrl: undefined,', 'baseUrl: providers?.[target.provider]?.baseUrl ?? undefined,')
	replaceRequired(index, 'void applyModel(next.model, applyContext);', 'void applyModel(next.model, next.providers, applyContext);')
	replaceRequired(
		index,
		'\t\t\tapplyContext,\n\t\t);',
		'\t\t\tfour.settings.providers,\n\t\t\tapplyContext,\n\t\t);',
		'\t\t\tfour.settings.providers,\n\t\t\tapplyContext,',
	)
	replaceRequired(
		index,
		'\t\t\tfour.settings.providers,\n\t\t\tapplyContext,\n\t\t);\n\t}\n\n\t// 8. Initial catalog scan + sessions index (writes back to settings.json).',
		'\t\t\tfour.settings.providers,\n\t\t\tapplyContext,\n\t\t).finally(() => {\n\t\t\tpi.setThinkingLevel(four.settings.runtime?.thinkingLevel ?? four.settings.defaultThinkingLevel ?? "medium");\n\t\t});\n\t} else {\n\t\tpi.setThinkingLevel(four.settings.runtime?.thinkingLevel ?? four.settings.defaultThinkingLevel ?? "medium");\n\t}\n\n\t// 8. Initial catalog scan + sessions index (writes back to settings.json).',
	)
}
