import { resolveExtensionPath } from './runtime-paths'

/** Resolve the prepared context extension for coordinator agents. */
export function resolveContextExtensionPath(resourcesPath?: string): string {
	return resolveExtensionPath('superhive-pi-context', resourcesPath)
}
