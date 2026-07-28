import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Bump when a prepared runtime needs a one-time compatibility refresh. */
export const RUNTIME_COMPATIBILITY_VERSION = 4

export function runtimeAssetNeedsRefresh(
	preparedRef: string | undefined,
	desiredRef: string,
	force = false,
): boolean {
	return force || preparedRef !== desiredRef
}

/**
 * Refuse to stamp a runtime as ready unless the truth extension preserves
 * Pi's catalog model. Reconstructing it as a custom non-reasoning model
 * silently clamps the configured thinking level to "off".
 */
export function applyRuntimeCompatibility(runtimeRoot: string): void {
	const truthRoot = join(runtimeRoot, 'extensions', 'superhive-pi-truth')
	const providerMap = join(truthRoot, 'provider-map.ts')
	const applier = join(truthRoot, 'applier.ts')
	const index = join(truthRoot, 'index.ts')
	if (!existsSync(providerMap) || !existsSync(applier) || !existsSync(index)) {
		throw new Error(`Missing superhive-pi-truth runtime files under ${truthRoot}`)
	}

	const providerSource = readFileSync(providerMap, 'utf8')
	const applierSource = readFileSync(applier, 'utf8')
	const indexSource = readFileSync(index, 'utf8')
	const compatible =
		providerSource.includes('minimax: "anthropic-messages"') &&
		providerSource.includes('PROVIDER_API[name.toLowerCase()]') &&
		applierSource.includes('resolveModel?:') &&
		applierSource.includes('if (resolvedModel)') &&
		applierSource.includes('{ ...resolvedModel, baseUrl: configuredBaseUrl }') &&
		indexSource.includes('void applyModel(') &&
		indexSource.includes(').finally(() => {') &&
		indexSource.includes('pi.setThinkingLevel(')
	if (!compatible) {
		throw new Error('Prepared superhive-pi-truth revision does not preserve reasoning-capable catalog models.')
	}
}
