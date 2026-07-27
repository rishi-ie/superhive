import { resolveExtensionPath } from './runtime-paths'

/** Resolve the prepared planning extension for coordinator agents. */
export function resolvePlanExtensionPath(resourcesPath?: string): string {
	return resolveExtensionPath('superhive-pi-plan', resourcesPath)
}
