import type { TemplateDetail, TemplateSummary } from '@/types/electron'

/**
 * Marketplace API thin wrappers. The src/api/ files are the only
 * place in the renderer that calls window.api.* — flows import
 * from here, components import from flows.
 *
 * Step 4 of the modularity-check rubric: no branching, no
 * transforms, no try-catch. The main process handles errors
 * and returns null where appropriate.
 */
export const templates = {
	list: (): Promise<TemplateSummary[]> => window.api.templates.list(),
	get: (id: string): Promise<TemplateDetail | null> => window.api.templates.get(id),
	openFolder: (): Promise<{ ok: boolean; path: string }> => window.api.templates.openFolder(),
}
