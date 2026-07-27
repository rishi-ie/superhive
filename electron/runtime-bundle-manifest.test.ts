import { expect, test } from 'bun:test'
import { loadRuntimeBundleManifest } from './runtime-bundle-manifest'

test('the runtime bundle manifest declares every core extension once', () => {
	const manifest = loadRuntimeBundleManifest()
	expect(manifest.generalKai.ref).toMatch(/^[a-f0-9]{40}$/)
	expect(Object.keys(manifest.extensions).sort()).toEqual([
		'superhive-pi-context',
		'superhive-pi-orchestration',
		'superhive-pi-plan',
		'superhive-pi-spawn',
		'superhive-pi-telemetry',
		'superhive-pi-truth',
	])
})
