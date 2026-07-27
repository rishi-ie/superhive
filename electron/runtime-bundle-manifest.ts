import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface RuntimeBundleManifest {
	schemaVersion: number
	generalKai: { repository: string; ref: string }
	extensions: Record<string, string>
}

const manifestPath = join(dirname(dirname(fileURLToPath(import.meta.url))), 'resources', 'runtime', 'manifest.json')

export function loadRuntimeBundleManifest(path = manifestPath): RuntimeBundleManifest {
	const value = JSON.parse(readFileSync(path, 'utf8')) as Partial<RuntimeBundleManifest>
	if (
		value.schemaVersion !== 1 ||
		typeof value.generalKai?.repository !== 'string' ||
		typeof value.generalKai.ref !== 'string' ||
		!value.extensions ||
		Object.values(value.extensions).some((ref) => typeof ref !== 'string')
	) throw new Error(`Invalid runtime bundle manifest: ${path}`)
	return value as RuntimeBundleManifest
}
