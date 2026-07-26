export type MarketplaceCapabilityKind = 'skill' | 'plugin' | 'mcp-adapter'

export interface MarketplaceCatalogItem {
	id: string
	kind: MarketplaceCapabilityKind
	version: string
	label: string
	description: string
	category: string
	permissions: string[]
	requiredConfiguration?: string[]
	source: { path: string; entry: string; integrity: string }
	activation: 'restart-required'
}

export interface InstalledMarketplaceItem {
	id: string
	version: string
	installedAt: string
	integrity: string
	status: 'installed'
}

export interface MarketplaceItem extends MarketplaceCatalogItem {
	installed?: InstalledMarketplaceItem
}

/** A capability selected for one pending turn. Its path is agent-local. */
export interface MarketplaceCapabilityRef {
	id: string
	kind: MarketplaceCapabilityKind
	label: string
	version: string
	agentPath: string
}

export interface MarketplaceActivationResult {
	capability: MarketplaceCapabilityRef
	restarted: boolean
}
