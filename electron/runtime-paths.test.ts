import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, test } from 'bun:test'
import { resolveExtensionPath, resolveGeneralKaiDir, resolveLauncherPath, resolvePiNode } from './runtime-paths'

function withPackagedResources<T>(resourcesPath: string, fn: () => T): T {
	const resourcesDescriptor = Object.getOwnPropertyDescriptor(process, 'resourcesPath')
	const defaultAppDescriptor = Object.getOwnPropertyDescriptor(process, 'defaultApp')
	const devServer = process.env.VITE_DEV_SERVER_URL
	Object.defineProperty(process, 'resourcesPath', { configurable: true, value: resourcesPath })
	Object.defineProperty(process, 'defaultApp', { configurable: true, value: undefined })
	delete process.env.VITE_DEV_SERVER_URL
	try {
		return fn()
	} finally {
		if (resourcesDescriptor) Object.defineProperty(process, 'resourcesPath', resourcesDescriptor)
		else Reflect.deleteProperty(process, 'resourcesPath')
		if (defaultAppDescriptor) Object.defineProperty(process, 'defaultApp', defaultAppDescriptor)
		else Reflect.deleteProperty(process, 'defaultApp')
		if (devServer === undefined) delete process.env.VITE_DEV_SERVER_URL
		else process.env.VITE_DEV_SERVER_URL = devServer
	}
}

describe('runtime paths', () => {
	test('uses the prepared per-user runtime while retaining explicit sibling overrides', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-dev-runtime-'))
		const siblingTruth = resolve(process.cwd(), '..', 'superhive-pi-truth')
		const previousRuntime = process.env.SUPERHIVE_RUNTIME_DIR
		const previousTruth = process.env.SUPERHIVE_PI_TRUTH_PATH
		try {
			mkdirSync(join(root, 'general-kai', 'pi', 'packages', 'coding-agent', 'dist'), { recursive: true })
			mkdirSync(join(root, 'extensions', 'superhive-pi-truth'), { recursive: true })
			writeFileSync(join(root, 'general-kai', 'pi', 'packages', 'coding-agent', 'dist', 'cli.js'), '')
			writeFileSync(join(root, 'extensions', 'superhive-pi-truth', 'index.ts'), '')
			process.env.SUPERHIVE_RUNTIME_DIR = root
			expect(resolveGeneralKaiDir()).toBe(join(root, 'general-kai'))
			expect(resolveExtensionPath('superhive-pi-truth')).toBe(join(root, 'extensions', 'superhive-pi-truth'))
			process.env.SUPERHIVE_PI_TRUTH_PATH = siblingTruth
			expect(resolveExtensionPath('superhive-pi-truth')).toBe(siblingTruth)
		} finally {
			if (previousRuntime === undefined) delete process.env.SUPERHIVE_RUNTIME_DIR
			else process.env.SUPERHIVE_RUNTIME_DIR = previousRuntime
			if (previousTruth === undefined) delete process.env.SUPERHIVE_PI_TRUTH_PATH
			else process.env.SUPERHIVE_PI_TRUTH_PATH = previousTruth
			rmSync(root, { recursive: true, force: true })
		}
	})

	test('uses only packaged resources and Electron-as-Node when packaged', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-packaged-runtime-'))
		try {
			const runtime = join(root, 'runtime')
			mkdirSync(join(runtime, 'general-kai', 'pi', 'packages', 'coding-agent', 'dist'), { recursive: true })
			mkdirSync(join(runtime, 'extensions', 'superhive-pi-truth'), { recursive: true })
			writeFileSync(join(runtime, 'general-kai', 'pi', 'packages', 'coding-agent', 'dist', 'cli.js'), '')
			writeFileSync(join(runtime, 'extensions', 'superhive-pi-truth', 'index.ts'), '')
			writeFileSync(join(runtime, 'agent-runner.mjs'), '')
			withPackagedResources(root, () => {
				expect(resolveGeneralKaiDir()).toBe(join(runtime, 'general-kai'))
				expect(resolveExtensionPath('superhive-pi-truth')).toBe(join(runtime, 'extensions', 'superhive-pi-truth'))
				expect(resolveLauncherPath('agent-runner.mjs')).toBe(join(runtime, 'agent-runner.mjs'))
				expect(resolvePiNode()).toEqual({ executable: process.execPath, electronRunAsNode: true })
			})
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})
})
