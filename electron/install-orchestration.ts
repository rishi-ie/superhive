import { resolveExtensionPath } from './runtime-paths'

/** Resolve the prepared orchestration extension for coordinator agents. */
export function resolveOrchestrationExtensionPath(resourcesPath?: string): string {
	return resolveExtensionPath('superhive-pi-orchestration', resourcesPath)
}
