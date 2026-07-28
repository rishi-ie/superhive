import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'bun:test'
import {
	applyRuntimeCompatibility,
	runtimeAssetNeedsRefresh,
} from './runtime-compatibility'

test('refreshes runtime assets when pinned refs are stale or refresh is forced', () => {
	expect(runtimeAssetNeedsRefresh('current', 'current')).toBe(false)
	expect(runtimeAssetNeedsRefresh('stale', 'current')).toBe(true)
	expect(runtimeAssetNeedsRefresh('current', 'current', true)).toBe(true)
})

test('accepts a truth extension that preserves reasoning-capable catalog models', () => {
	const root = mkdtempSync(join(tmpdir(), 'superhive-runtime-compat-'))
	try {
		const target = join(root, 'extensions', 'superhive-pi-truth')
		cpSync(join(process.cwd(), '..', 'superhive-pi-truth'), target, { recursive: true })
		applyRuntimeCompatibility(root)
		applyRuntimeCompatibility(root)
		expect(readFileSync(join(target, 'provider-map.ts'), 'utf8')).toContain('minimax: "anthropic-messages"')
		const applier = readFileSync(join(target, 'applier.ts'), 'utf8')
		expect(applier).toContain('applyModel(next.model, next.providers, ctx)')
		expect(applier).toContain('if (resolvedModel)')
		const index = readFileSync(join(target, 'index.ts'), 'utf8')
		expect(index).toContain('four.settings.providers,')
		expect(index).toContain('four.settings.defaultThinkingLevel')
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})

test('rejects a stale truth extension that reconstructs catalog models', () => {
	const root = mkdtempSync(join(tmpdir(), 'superhive-runtime-compat-stale-'))
	try {
		const target = join(root, 'extensions', 'superhive-pi-truth')
		cpSync(join(process.cwd(), '..', 'superhive-pi-truth'), target, { recursive: true })
		const applierPath = join(target, 'applier.ts')
		writeFileSync(
			applierPath,
			readFileSync(applierPath, 'utf8').replace('resolveModel?:', 'resolveContextWindow?:'),
		)
		expect(() => applyRuntimeCompatibility(root)).toThrow('does not preserve reasoning-capable catalog models')
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})
