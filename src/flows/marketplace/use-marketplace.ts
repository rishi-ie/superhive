import { useCallback, useEffect, useState } from 'react'
import { marketplace } from '@/api/marketplace'
import type { MarketplaceActivationResult, MarketplaceItem } from '@/models/marketplace'

export function useMarketplace() {
	const [items, setItems] = useState<MarketplaceItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const reload = useCallback(async () => {
		setIsLoading(true)
		try { setItems(await marketplace.list()); setError(null) }
		catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)) }
		finally { setIsLoading(false) }
	}, [])
	useEffect(() => {
		void reload()
		return window.api.marketplace.onChanged(() => { void reload() })
	}, [reload])
	const install = useCallback(async (id: string) => { const item = await marketplace.install(id); await reload(); return item }, [reload])
	const remove = useCallback(async (id: string) => { await marketplace.remove(id); await reload() }, [reload])
	const activate = useCallback(async (agentId: string, id: string): Promise<MarketplaceActivationResult> => {
		const result = await marketplace.activateForAgent(agentId, id); await reload(); return result
	}, [reload])
	return { items, isLoading, error, reload, install, remove, activate }
}
