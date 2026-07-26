import type { MarketplaceActivationResult, MarketplaceItem } from '@/models/marketplace'

export const marketplace = {
	list: (): Promise<MarketplaceItem[]> => window.api.marketplace.list(),
	get: (id: string): Promise<MarketplaceItem | null> => window.api.marketplace.get(id),
	install: (id: string): Promise<MarketplaceItem> => window.api.marketplace.install(id),
	remove: (id: string): Promise<void> => window.api.marketplace.remove(id),
	activateForAgent: (agentId: string, id: string): Promise<MarketplaceActivationResult> => window.api.marketplace.activateForAgent(agentId, id),
}
