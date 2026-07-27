import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dir, '..')
const resourcesManifestPath = join(root, 'resources', 'runtime', 'manifest.json')
const preparedManifestPath = join(root, '.runtime', 'runtime-manifest.json')

function readJson(path: string): Record<string, unknown> {
	if (!existsSync(path)) throw new Error(`Missing runtime manifest: ${path}. Run "bun run setup" first.`)
	return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
}

const resources = readJson(resourcesManifestPath)
const prepared = readJson(preparedManifestPath)
const expectedGeneralKai = (resources.generalKai as { ref?: string } | undefined)?.ref
const actualGeneralKai = prepared.generalKaiRef
if (!expectedGeneralKai || actualGeneralKai !== expectedGeneralKai) {
	throw new Error(`Pi runtime drift detected: expected ${expectedGeneralKai ?? '(missing)'} but prepared ${String(actualGeneralKai)}`)
}

const expectedExtensions = resources.extensions as Record<string, string> | undefined
const actualExtensions = prepared.extensions as Record<string, string> | undefined
if (!expectedExtensions || !actualExtensions) throw new Error('Runtime extension manifest is incomplete.')

for (const [name, ref] of Object.entries(expectedExtensions)) {
	if (actualExtensions[name] !== ref) {
		throw new Error(`Extension drift detected for ${name}: expected ${ref} but prepared ${String(actualExtensions[name])}`)
	}
	const extensionPath = join(root, '.runtime', 'extensions', name, 'index.ts')
	if (!existsSync(extensionPath)) throw new Error(`Prepared extension bundle is missing: ${extensionPath}`)
}

const piEntry = join(root, '.runtime', 'general-kai', 'pi', 'packages', 'coding-agent', 'dist', 'cli.js')
if (!existsSync(piEntry)) throw new Error(`Prepared Pi runtime entry is missing: ${piEntry}`)

console.log(`[bundle] verified Pi ${expectedGeneralKai} and ${Object.keys(expectedExtensions).length} pinned extensions`)
