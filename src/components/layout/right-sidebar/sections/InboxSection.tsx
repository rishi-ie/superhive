import { Icon } from '@/components/ui/icon'
import { TrayIcon, CheckIcon, XIcon } from '@phosphor-icons/react'
import type { InboxItemRaw } from '@/flows/agents/settings/use-agent-inbox'
import { useAgentInbox } from '@/flows/agents/settings'

interface InboxSectionProps {
	agentId: string | null
	projectName?: string | null
}

function formatTime(iso: string): string {
	try {
		const d = new Date(iso)
		return d.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		})
	} catch {
		return iso
	}
}

function ItemRow({
	item,
	onMarkRead,
}: {
	item: InboxItemRaw
	onMarkRead: (id: string, answeredWith?: unknown) => void
}) {
	const severityClass =
		item.severity === 'error'
			? 'border-destructive/30 bg-destructive/5'
			: item.severity === 'warning'
				? 'border-yellow-500/30 bg-yellow-500/5'
				: 'border-border/40 bg-card/30'
	return (
		<div className={`flex flex-col gap-2 rounded-md border p-3 ${severityClass}`}>
			<div className="flex items-start justify-between gap-2">
				<div className="flex flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
							{item.kind}
						</span>
						{item.status === 'pending' && (
							<span className="size-1.5 rounded-full bg-primary/70" aria-label="pending" />
						)}
					</div>
					<span className="text-sm text-foreground">{item.message}</span>
				</div>
				<span className="shrink-0 text-[11px] text-muted-foreground">
					{formatTime(item.createdAt)}
				</span>
			</div>
			{item.status === 'pending' && (
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="flex items-center gap-1 rounded-md border border-border/40 bg-background/40 px-2 py-1 text-xs text-foreground/80 hover:bg-background/60"
						onClick={() => onMarkRead(item.id)}
					>
						<Icon icon={CheckIcon} className="size-3" />
						Mark read
					</button>
					{item.kind === 'question' && (
						<button
							type="button"
							className="flex items-center gap-1 rounded-md border border-border/40 bg-background/40 px-2 py-1 text-xs text-foreground/80 hover:bg-background/60"
							onClick={() => onMarkRead(item.id, 'dismissed')}
						>
							<Icon icon={XIcon} className="size-3" />
							Dismiss
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export function InboxSection({ agentId, projectName }: InboxSectionProps) {
	const { items, isLoading, markRead, clear, reload } = useAgentInbox(agentId)

	if (!agentId) {
		return (
			<div className="flex h-full items-center justify-center text-xs text-muted-foreground">
				Select a coordinator agent to view its inbox.
			</div>
		)
	}

	const pending = items.filter((i) => i.status === 'pending')
	const rest = items.filter((i) => i.status !== 'pending')

	if (isLoading && items.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-xs text-muted-foreground">
				Loading inbox…
			</div>
		)
	}

	if (items.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-gap-loose text-center">
				<Icon icon={TrayIcon} className="size-8 text-muted-foreground/30" />
				<p className="text-xs text-muted-foreground">
					No pending requests from{' '}
					<span className="text-foreground/80">{projectName ?? 'this project'}</span>.
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-4 px-card-x py-card-y">
			<div className="flex items-center justify-between">
				<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
					{pending.length > 0 ? `Pending (${pending.length})` : 'Inbox'}
				</span>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="rounded-md border border-border/40 bg-card/30 px-2 py-1 text-[11px] text-foreground/70 hover:bg-card/50"
						onClick={() => void reload()}
					>
						Refresh
					</button>
					{rest.length > 0 && (
						<button
							type="button"
							className="rounded-md border border-border/40 bg-card/30 px-2 py-1 text-[11px] text-foreground/70 hover:bg-card/50"
							onClick={() => void clear('pending')}
						>
							Clear pending
						</button>
					)}
				</div>
			</div>
			{pending.map((item) => (
				<ItemRow key={item.id} item={item} onMarkRead={markRead} />
			))}
			{rest.length > 0 && (
				<details className="text-xs text-muted-foreground">
					<summary className="cursor-pointer py-1">Past items ({rest.length})</summary>
					<div className="flex flex-col gap-2 pt-2">
						{rest.map((item) => (
							<ItemRow key={item.id} item={item} onMarkRead={markRead} />
						))}
					</div>
				</details>
			)}
		</div>
	)
}
