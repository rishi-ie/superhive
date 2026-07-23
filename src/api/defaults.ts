import type { ProjectAgentDefaults } from '@/types/electron'

export const defaults = {
	get: (): Promise<ProjectAgentDefaults | null> => window.api.defaults.get(),
}
