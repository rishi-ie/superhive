import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'bun:test'
import { isRuntimePrepared } from './runtime-provisioner'
import { RUNTIME_COMPATIBILITY_VERSION } from '../scripts/runtime-compatibility'
import { loadRuntimeBundleManifest } from './runtime-bundle-manifest'

test('requires Pi and every extension before accepting a prepared runtime', () => {
	const root = mkdtempSync(join(tmpdir(), 'superhive-runtime-'))
	const bundle = loadRuntimeBundleManifest()
	try {
		mkdirSync(join(root, 'general-kai', 'pi', 'packages', 'coding-agent', 'dist'), { recursive: true })
		writeFileSync(join(root, 'general-kai', 'pi', 'packages', 'coding-agent', 'dist', 'cli.js'), '')
		expect(isRuntimePrepared(root)).toBe(false)

		for (const name of [
			'superhive-pi-truth',
			'superhive-pi-telemetry',
			'superhive-pi-context',
			'superhive-pi-orchestration',
			'superhive-pi-plan',
			'superhive-pi-spawn',
		]) {
			mkdirSync(join(root, 'extensions', name), { recursive: true })
			writeFileSync(join(root, 'extensions', name, 'index.ts'), '')
		}
		const writeManifest = (overrides: Record<string, unknown> = {}) => {
			writeFileSync(join(root, 'runtime-manifest.json'), JSON.stringify({
				version: RUNTIME_COMPATIBILITY_VERSION,
				generalKaiRef: bundle.generalKai.ref,
				extensions: bundle.extensions,
				...overrides,
			}))
		}
		writeManifest()
		expect(isRuntimePrepared(root)).toBe(true)

		writeManifest({ version: RUNTIME_COMPATIBILITY_VERSION - 1 })
		expect(isRuntimePrepared(root)).toBe(false)

		writeManifest({
			extensions: {
				...bundle.extensions,
				'superhive-pi-truth': 'stale-ref',
			},
		})
		expect(isRuntimePrepared(root)).toBe(false)

		writeManifest({ generalKaiRef: 'stale-ref' })
		expect(isRuntimePrepared(root)).toBe(false)
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})
