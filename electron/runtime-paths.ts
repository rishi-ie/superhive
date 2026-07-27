import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RUNTIME_DIR_NAME = '.runtime'

function walkUp(start: string, target: string): string | null {
	let current = resolve(start)
	for (;;) {
		const candidate = join(current, target)
		if (existsSync(candidate)) return candidate
		const parent = dirname(current)
		if (parent === current) return null
		current = parent
	}
}

function runtimeRoot(): string {
	const candidates = [
		process.env.SUPERHIVE_RUNTIME_DIR,
		process.resourcesPath ? join(process.resourcesPath, 'runtime') : undefined,
		join(process.cwd(), RUNTIME_DIR_NAME),
		walkUp(process.cwd(), RUNTIME_DIR_NAME),
	]
		.filter((value): value is string => Boolean(value))

	for (const candidate of candidates) {
		if (existsSync(candidate)) return resolve(candidate)
	}

	return resolve(process.cwd(), RUNTIME_DIR_NAME)
}

export function resolveGeneralKaiDir(): string {
	const candidates = [
		process.env.SUPERHIVE_GENERAL_KAI_PATH,
		join(runtimeRoot(), 'general-kai'),
		walkUp(process.cwd(), 'general-kai'),
	]
		.filter((value): value is string => Boolean(value))

	for (const candidate of candidates) {
		if (existsSync(join(candidate, 'pi', 'packages', 'coding-agent'))) {
			return resolve(candidate)
		}
	}

	return resolve(candidates[0] ?? join(runtimeRoot(), 'general-kai'))
}

export function resolveExtensionPath(name: string, resourcesPath?: string): string {
	const suffix = name.replace(/^superhive-pi-/, '').replaceAll('-', '_').toUpperCase()
	const envName = `SUPERHIVE_PI_${suffix}_PATH`
	const genericEnvName = `SUPERHIVE_${name.replaceAll('-', '_').toUpperCase()}_PATH`
	const candidates = [
		process.env[envName],
		process.env[genericEnvName],
		resourcesPath ? join(resourcesPath, 'extensions', name) : undefined,
		process.resourcesPath ? join(process.resourcesPath, 'extensions', name) : undefined,
		join(runtimeRoot(), 'extensions', name),
		walkUp(process.cwd(), name),
	]
		.filter((value): value is string => Boolean(value))

	for (const candidate of candidates) {
		if (existsSync(join(candidate, 'index.ts'))) return resolve(candidate)
	}

	throw new Error(
		`${name} is not prepared. Run "bun run setup" from the superhive directory, ` +
		`then restart the app. Checked: ${candidates.join(', ')}`,
	)
}

export function resolveLauncherPath(name: string): string {
	const candidates = [
		join(process.cwd(), 'runtime', name),
		process.resourcesPath ? join(process.resourcesPath, 'runtime', name) : undefined,
		join(dirname(fileURLToPath(import.meta.url)), '..', 'runtime', name),
	].filter((value): value is string => Boolean(value))

	for (const candidate of candidates) {
		if (existsSync(candidate)) return resolve(candidate)
	}

	throw new Error(`Bundled launcher ${name} is missing. Reinstall dependencies and run "bun run setup".`)
}
