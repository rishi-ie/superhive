import { useMemo, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { HugeIcon } from '@/components/ui/huge-icon'
import { useMarketplace } from '@/flows/marketplace'
import type { MarketplaceItem } from '@/models/marketplace'
import { FunnelSimpleIcon, MagnifyingGlassIcon } from '@phosphor-icons/react'
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import generalWorkerProfile from '../../../resources/agent-profiles/general-worker.json'

type MarketplaceSection = 'plugins' | 'skills' | 'agents'
type Scope = 'public' | 'personal'

const copy: Record<MarketplaceSection, { label: string; description: string }> = {
	plugins: { label: 'Plugins', description: 'Extend the Pi runtime with curated tools and MCP adapters.' },
	skills: { label: 'Skills', description: 'Add reusable instructions to the agents working on your projects.' },
	agents: { label: 'Agents', description: 'Discover specialized agents built for focused work.' },
}

const agentDirectory = [
	{ id: generalWorkerProfile.id, label: generalWorkerProfile.label, description: generalWorkerProfile.description, category: 'Built-in' },
	{ id: 'developer-agent', label: 'Developer agent', description: 'Plans, builds, and reviews software work.', category: 'Engineering' },
	{ id: 'research-agent', label: 'Research agent', description: 'Finds sources and produces curated briefs.', category: 'Research' },
	{ id: 'marketing-agent', label: 'Marketing agent', description: 'Shapes positioning, campaigns, and launch copy.', category: 'Marketing' },
]

function AssetSlot({ className = '' }: { className?: string }) {
	return <span aria-hidden="true" className={`shrink-0 rounded-lg border border-border/70 bg-card/40 ${className}`} />
}

function Details({ item, onClose, onInstall, onRemove }: { item: MarketplaceItem; onClose: () => void; onInstall: () => void; onRemove: () => void }) {
	const needsUpdate = Boolean(item.installed && item.installed.version !== item.version)
	return <section className="mt-4 rounded-xl border border-border/70 bg-card/30 p-4 text-sm">
		<div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.label}</p><p className="mt-1 text-muted-foreground">v{item.version} · {item.kind === 'mcp-adapter' ? 'MCP adapter' : item.kind}</p></div><button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">Close</button></div>
		<p className="mt-3 text-muted-foreground">{item.description}</p>
		<div className="mt-3 space-y-1 text-muted-foreground"><p>Source: bundled curated catalog</p><p>Permissions: {item.permissions.length ? item.permissions.join(', ') : 'None declared'}</p>{item.requiredConfiguration?.length ? <p>Before activation: {item.requiredConfiguration.join(', ')}</p> : null}</div>
		<div className="mt-4"><button type="button" onClick={item.installed && !needsUpdate ? onRemove : onInstall} className="rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-secondary">{needsUpdate ? 'Update' : item.installed ? 'Remove' : 'Install'}</button></div>
	</section>
}

function CatalogRow({ item, scope, detailOpen, onDetails, onInstall, onRemove }: { item: MarketplaceItem; scope: Scope; detailOpen: boolean; onDetails: () => void; onInstall: () => void; onRemove: () => void }) {
	const isInstalled = Boolean(item.installed)
	const needsUpdate = Boolean(item.installed && item.installed.version !== item.version)
	return <div className="min-w-0 border-b border-border/45 py-3 last:border-b-0"><div className="flex items-center gap-2.5"><AssetSlot className="size-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{item.label}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</p></div><button type="button" aria-label={`Details for ${item.label}`} onClick={onDetails} className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><HugeIcon icon={MoreHorizontalIcon} size={14} /></button><button type="button" disabled={isInstalled && !needsUpdate && scope === 'public'} onClick={isInstalled && !needsUpdate ? onRemove : onInstall} className="shrink-0 rounded-lg border border-border/80 px-2.5 py-1 text-xs font-medium hover:bg-secondary disabled:cursor-default disabled:opacity-60">{needsUpdate ? 'Update' : isInstalled ? (scope === 'public' ? 'Installed' : 'Remove') : 'Install'}</button></div>{detailOpen ? <Details item={item} onClose={onDetails} onInstall={onInstall} onRemove={onRemove} /> : null}</div>
}

function AgentRow({ agent, detailOpen, onDetails }: { agent: typeof agentDirectory[number]; detailOpen: boolean; onDetails: () => void }) {
	return <div className="min-w-0 border-b border-border/45 py-3 last:border-b-0"><div className="flex items-center gap-2.5"><AssetSlot className="size-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{agent.label}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{agent.description}</p></div><button type="button" aria-label={`Details for ${agent.label}`} onClick={onDetails} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><HugeIcon icon={MoreHorizontalIcon} size={14} /></button></div>{detailOpen ? <section className="mt-4 rounded-xl border border-border/70 bg-card/30 p-4 text-sm"><p className="font-medium">{agent.label}</p><p className="mt-2 text-muted-foreground">{agent.description}</p><p className="mt-3 text-muted-foreground">Discovery only — installation and project assignment are not available yet.</p></section> : null}</div>
}

export function MarketplacePage() {
	const [activeSection, setActiveSection] = useState<MarketplaceSection>('plugins')
	const [scope, setScope] = useState<Scope>('public')
	const [search, setSearch] = useState('')
	const [category, setCategory] = useState('All')
	const [details, setDetails] = useState<string | null>(null)
	const { items, isLoading, error, install, remove } = useMarketplace()
	const content = copy[activeSection]
	const capabilityItems = useMemo(() => items.filter((item) => activeSection === 'skills' ? item.kind === 'skill' : item.kind !== 'skill'), [activeSection, items])
	const categories = useMemo(() => ['All', ...Array.from(new Set(capabilityItems.map((item) => item.category)))], [capabilityItems])
	const visible = useMemo(() => capabilityItems.filter((item) => {
		const needle = search.trim().toLowerCase()
		return (scope === 'public' || item.installed) && (category === 'All' || item.category === category) && (!needle || `${item.label} ${item.description} ${item.kind}`.toLowerCase().includes(needle))
	}), [capabilityItems, category, scope, search])
	const grouped = useMemo(() => Array.from(new Map(visible.map((item) => [item.category, visible.filter((candidate) => candidate.category === item.category)])).entries()), [visible])
	const agents = useMemo(() => agentDirectory.filter((agent) => !search.trim() || `${agent.label} ${agent.description}`.toLowerCase().includes(search.trim().toLowerCase())), [search])
	const installed = capabilityItems.filter((item) => item.installed)
	const toggleDetails = (id: string) => setDetails((current) => current === id ? null : id)

	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<nav aria-label="Marketplace sections" role="tablist" className="flex shrink-0 items-center gap-1 px-4 pb-2 pt-3">
				{(Object.keys(copy) as MarketplaceSection[]).map((section) => <button type="button" role="tab" aria-selected={section === activeSection} key={section} onClick={() => { setActiveSection(section); setDetails(null); setCategory('All') }} className={`rounded-lg px-2.5 py-1.5 text-sm font-medium ${section === activeSection ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'}`}>{copy[section].label}</button>)}
			</nav>
			<main className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
				<div className="mx-auto w-full max-w-5xl px-5 pb-10 pt-8 sm:px-8">
					<section className="mx-auto max-w-3xl"><h1 className="text-3xl font-medium tracking-tight">{content.label}</h1><p className="mt-1.5 text-base text-muted-foreground">{content.description}</p><label className="mt-5 flex h-10 items-center gap-2 rounded-full border border-border bg-card/40 px-3 text-muted-foreground"><Icon icon={MagnifyingGlassIcon} className="size-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${content.label.toLowerCase()}`} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /></label></section>
					{activeSection !== 'agents' ? <><section className="mx-auto mt-8 max-w-3xl"><div className="flex items-center justify-between border-b border-border/60 pb-2.5"><h2 className="text-base font-medium">Installed</h2><span className="text-xs text-muted-foreground">Global library</span></div><div className="flex min-h-14 flex-wrap items-center gap-2 py-3">{installed.length ? installed.map((item) => <button key={item.id} type="button" title={item.label} onClick={() => toggleDetails(item.id)} className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card/40 text-[10px] text-muted-foreground">{item.label.slice(0, 1)}</button>) : <span className="text-xs text-muted-foreground">Nothing installed yet</span>}</div></section><section className="mx-auto mt-4 flex max-w-3xl items-center justify-between gap-3"><div className="flex items-center gap-1 text-sm"><button type="button" onClick={() => setScope('public')} className={`rounded-lg px-2.5 py-1.5 ${scope === 'public' ? 'bg-secondary font-medium' : 'text-muted-foreground'}`}>Public</button><button type="button" onClick={() => setScope('personal')} className={`rounded-lg px-2.5 py-1.5 ${scope === 'personal' ? 'bg-secondary font-medium' : 'text-muted-foreground'}`}>Personal</button></div><label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Icon icon={FunnelSimpleIcon} className="size-4" /><span className="sr-only">Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="bg-transparent outline-none">{categories.map((entry) => <option key={entry}>{entry}</option>)}</select></label></section></> : null}
					<div className="mx-auto mt-7 max-w-3xl space-y-7">
						{activeSection === 'agents' ? <section><h2 className="border-b border-border/60 pb-2.5 text-base font-medium">Directory</h2><div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">{agents.map((agent) => <AgentRow key={agent.id} agent={agent} detailOpen={details === agent.id} onDetails={() => toggleDetails(agent.id)} />)}</div></section> : grouped.map(([name, entries]) => <section key={name}><h2 className="border-b border-border/60 pb-2.5 text-base font-medium">{name}</h2><div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">{entries.map((item) => <CatalogRow key={item.id} item={item} scope={scope} detailOpen={details === item.id} onDetails={() => toggleDetails(item.id)} onInstall={() => void install(item.id)} onRemove={() => void remove(item.id)} />)}</div></section>)}
						{isLoading ? <p className="text-sm text-muted-foreground">Loading catalog…</p> : null}
						{error ? <p className="text-sm text-destructive">{error}</p> : null}
						{!isLoading && activeSection !== 'agents' && !visible.length ? <p className="text-sm text-muted-foreground">No capabilities match these filters.</p> : null}
					</div>
				</div>
			</main>
		</div>
	)
}
