import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function isPackagedApp(): boolean {
	// Electron sets defaultApp only for `electron .` / Vite development.
	// A packaged app must never fall back to a developer checkout.
	return Boolean(process.resourcesPath && !process.defaultApp && !process.env.VITE_DEV_SERVER_URL)
}

export function runtimeRoot(): string {
	if (isPackagedApp()) {
		return resolve(process.resourcesPath!, 'runtime')
	}

	return resolve(process.env.SUPERHIVE_RUNTIME_DIR ?? join(homedir(), '.superhive', 'runtime'))
}

export function resolveGeneralKaiDir(): string {
	if (isPackagedApp()) return join(runtimeRoot(), 'general-kai')

	const candidates = [
		process.env.SUPERHIVE_GENERAL_KAI_PATH,
		join(runtimeRoot(), 'general-kai'),
	]
		.filter((value): value is string => Boolean(value))

	for (const candidate of candidates) {
		// Explicit overrides must point at a compiled Pi runtime. The normal
		// development path is the durable per-user runtime prepared on first use.
		if (existsSync(join(candidate, 'pi', 'packages', 'coding-agent', 'dist', 'cli.js'))) {
			return resolve(candidate)
		}
	}

	return resolve(candidates[0] ?? join(runtimeRoot(), 'general-kai'))
}

export function resolveExtensionPath(name: string, resourcesPath?: string): string {
	if (isPackagedApp()) {
		const source = join(resourcesPath ?? process.resourcesPath!, 'runtime', 'extensions', name)
		if (existsSync(join(source, 'index.ts'))) return resolve(source)
		throw new Error(`Bundled extension ${name} is missing at ${source}. Reinstall Superhive.`)
	}

	const suffix = name.replace(/^superhive-pi-/, '').replaceAll('-', '_').toUpperCase()
	const envName = `SUPERHIVE_PI_${suffix}_PATH`
	const genericEnvName = `SUPERHIVE_${name.replaceAll('-', '_').toUpperCase()}_PATH`
	const candidates = [
		process.env[envName],
		process.env[genericEnvName],
		join(runtimeRoot(), 'extensions', name),
	]
		.filter((value): value is string => Boolean(value))

	for (const candidate of candidates) {
		if (existsSync(join(candidate, 'index.ts'))) return resolve(candidate)
	}

	throw new Error(
		`${name} is not prepared. Create or start an agent while online to prepare the runtime. ` +
		`Checked: ${candidates.join(', ')}`,
	)
}

export function resolveLauncherPath(name: string): string {
	if (isPackagedApp()) {
		const launcher = join(process.resourcesPath!, 'runtime', name)
		if (existsSync(launcher)) return resolve(launcher)
		throw new Error(`Bundled launcher ${name} is missing. Reinstall Superhive.`)
	}

	const candidates = [
		join(process.cwd(), 'runtime', name),
		join(dirname(fileURLToPath(import.meta.url)), '..', 'runtime', name),
	].filter((value): value is string => Boolean(value))

	for (const candidate of candidates) {
		if (existsSync(candidate)) return resolve(candidate)
	}

	throw new Error(`Bundled launcher ${name} is missing. Reinstall dependencies and run "bun run setup".`)
}

export function resolvePiNode(): { executable: string; electronRunAsNode: boolean } {
	if (process.env.PI_NODE) return { executable: process.env.PI_NODE, electronRunAsNode: false }
	if (isPackagedApp()) return { executable: process.execPath, electronRunAsNode: true }
	return { executable: 'node', electronRunAsNode: false }
}
