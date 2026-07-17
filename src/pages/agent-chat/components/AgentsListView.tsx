import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import {
	PlusIcon,
	MagnifyingGlassIcon,
	XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableHeader,
	TableBody,
	TableHead,
	TableRow,
} from "@/components/ui/table";
import { AgentListRow } from './AgentListRow';
import { EmptyAgentsState } from './EmptyAgentsState';
import { AgentAssignToProjectDialog } from './AgentAssignToProjectDialog';
import { DeleteAgentDialog } from './DeleteAgentDialog';
import { UnassignAgentDialog } from '@/components/layout/right-sidebar/sections/UnassignAgentDialog';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { deleteAgent } from '@/flows/agents/crud/delete-agent';
import { listProjects } from '@/flows/projects/crud/list-projects';
import {
	assignAgentToProject,
	removeAgentFromProject,
} from '@/flows/projects/crud';
import { useOpenCreateAgent } from '@/flows/agents/ui/open-create-agent';
import { useAgentsListVersion, useAllAgentStatuses } from '@/stores/agent';
import type { Agent, Project } from '@/types/electron';

type DialogKind =
	| { kind: 'closed' }
	| { kind: 'assign'; agentId: string }
	| { kind: 'remove'; agentId: string; projectId: string; agentName: string; live: boolean }
	| { kind: 'delete'; agentId: string; agentName: string };

const EXIT_ANIMATION_MS = 250;

export function AgentsListView() {
	const [agents, setAgents] = React.useState<Agent[]>([]);
	const [projectsById, setProjectsById] = React.useState<Record<string, Project>>({});
	const [loading, setLoading] = React.useState(true);
	const [filter, setFilter] = React.useState('');
	const [dialog, setDialog] = React.useState<DialogKind>({ kind: 'closed' });
	const [visibleDialog, setVisibleDialog] = React.useState<DialogKind>({ kind: 'closed' });
	const { setOpen: setCreateOpen } = useOpenCreateAgent();
	const navigate = useNavigate();
	// Bumps whenever db.agents.json is updated by the fs watcher — drives
	// re-fetch on adoption/eviction so the table reflects filesystem state.
	const agentsVersion = useAgentsListVersion();

	/**
	 * Row click handler — delegated to <TableBody> rather than attached to
	 * the <tr> itself. The row is wrapped in <ContextMenuTrigger asChild>
	 * (Radix Slot), which merges aria-haspopup="menu" + data-state onto the
	 * same <tr>. Combined with role="button" + onClick, Chromium silently
	 * swallows the left-click activation on a non-button slot target
	 * (and <tr> isn't in Radix's allowed slot-target list at all).
	 * Delegating to the body sidesteps the slot entirely.
	 *
	 * The Project column's <Link> already calls e.stopPropagation(), so a
	 * click on the project name resolves at the Link and never bubbles
	 * here; the closest('a') check below is defensive in depth.
	 */
	const handleRowClick = React.useCallback(
		(e: React.MouseEvent<HTMLTableSectionElement>) => {
			const target = e.target as HTMLElement
			if (target.closest('a')) return
			const row = target.closest<HTMLElement>('[data-agent-row]')
			const id = row?.dataset.agentRow
			if (!id) return
			navigate(`/agents/${id}`)
		},
		[navigate],
	)

	const reload = React.useCallback(async () => {
		const [agentList, projectList] = await Promise.all([
			listAgents(),
			listProjects().catch(() => [] as Project[]),
		]);
		setAgents(agentList);
		const map: Record<string, Project> = {};
		projectList.forEach((p) => { map[p.id] = p; });
		setProjectsById(map);
	}, []);

	React.useEffect(() => {
		let cancelled = false;
		reload()
			.catch(() => { if (!cancelled) setAgents([]); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [reload, agentsVersion]);

	React.useEffect(() => {
		if (dialog.kind !== 'closed') {
			setVisibleDialog(dialog);
		} else {
			const t = setTimeout(() => setVisibleDialog({ kind: 'closed' }), EXIT_ANIMATION_MS);
			return () => clearTimeout(t);
		}
	}, [dialog]);

	const nonCoordinators = React.useMemo(
		() => agents.filter((a) => a.agentKind !== 'project-coordinator'),
		[agents],
	);

	const liveStatesMap = useAllAgentStatuses(
		nonCoordinators.map((a) => a.id),
		nonCoordinators.length > 0,
	);

	const agentsWithLiveStatus = React.useMemo(
		() =>
			nonCoordinators.map((a) => {
				const live = liveStatesMap.get(a.id)
				return live ? { ...a, status: live.status } : a
			}),
		[nonCoordinators, liveStatesMap],
	);

	const filtered = React.useMemo(() => {
		const q = filter.trim().toLowerCase();
		if (!q) return agentsWithLiveStatus;
		return agentsWithLiveStatus.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.role?.toLowerCase().includes(q) ||
				a.description?.toLowerCase().includes(q),
		);
	}, [agentsWithLiveStatus, filter]);

	const projectFor = (agent: Agent): { id: string; name: string } | null => {
		const firstId = agent.projectIds[0];
		if (!firstId) return null;
		const p = projectsById[firstId];
		if (!p) return null;
		return { id: p.id, name: p.name };
	};

	const parentDir = `~/.superhive/agents`;

	const liveStatuses = new Set<Agent['status']>(['active', 'busy', 'waiting']);

	const dialogAgent =
		visibleDialog.kind === 'assign' || visibleDialog.kind === 'delete'
			? agents.find((a) => a.id === visibleDialog.agentId) ?? null
			: null;

	return (
		<div className="flex h-full w-full flex-col bg-background">
			<header className="flex flex-col gap-gap-tight px-8 pt-12 pb-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-col gap-gap-tight">
						<h1 className="text-2xl font-semibold tracking-tight text-foreground">
							Agents
						</h1>
						<p className="text-sm text-muted-foreground">
							{loading
								? 'Loading agents…'
								: `${nonCoordinators.length} ${nonCoordinators.length === 1 ? 'agent' : 'agents'}`}
						</p>
					</div>
					<Button
						size="default"
						onClick={() => setCreateOpen(true)}
						className="gap-list-item"
					>
						<Icon icon={PlusIcon} className="size-4" />
						New agent
					</Button>
				</div>

				{nonCoordinators.length > 0 && (
					<div className="relative mt-2 max-w-md">
						<Icon
							icon={MagnifyingGlassIcon}
							className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
						/>
						<input
							type="text"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder="Search agents…"
							className="w-full rounded-button border border-input bg-input/20 py-1.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/40"
						/>
						{filter ? (
							<button
								type="button"
								onClick={() => setFilter('')}
								aria-label="Clear search"
								className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
							>
								<Icon icon={XIcon} className="size-3" />
							</button>
						) : null}
					</div>
				)}
			</header>

			<ScrollArea className="flex-1">
				<div className="px-8 pb-12">
					{loading ? null : nonCoordinators.length === 0 ? (
						<EmptyAgentsState />
					) : filtered.length === 0 ? (
						<div className="flex h-40 flex-col items-center justify-center gap-gap-tight text-center">
							<span className="text-sm text-muted-foreground">
								No agents match "{filter}"
							</span>
						</div>
					) : (
						<div className="rounded-card border border-border overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow className="hover:bg-transparent">
										<TableHead className="w-[260px]">Name</TableHead>
										<TableHead>Role</TableHead>
										<TableHead className="w-[140px]">Status</TableHead>
										<TableHead className="w-[180px]">Project</TableHead>
										<TableHead className="w-[160px]">Activity</TableHead>
										<TableHead className="w-[100px] text-right">Updated</TableHead>
										<TableHead className="w-10" />
									</TableRow>
								</TableHeader>
<TableBody onClick={handleRowClick}>
								{filtered.map((agent) => {
									const live = liveStatesMap.get(agent.id)
									return (
									<AgentListRow
										key={agent.id}
										agent={agent}
										project={projectFor(agent)}
										parentDir={parentDir}
										liveStatus={live?.status}
										liveBootStep={live?.bootStep}
										onRowNavigate={(id) => navigate(`/agents/${id}`)}
										onOpenAssignProject={(agentId) =>
											setDialog({ kind: 'assign', agentId })
										}
											onOpenRemoveProject={(agentId, projectIdHint) => {
												const projectId = projectIdHint ?? agent.projectIds[0] ?? '';
												if (!projectId) return;
												const live = liveStatuses.has(agent.status);
												setDialog({
													kind: 'remove',
													agentId,
													projectId,
													agentName: agent.name,
													live,
												});
											}}
											onOpenDelete={(agentId) =>
												setDialog({ kind: 'delete', agentId, agentName: agent.name })
											}
onForked={() => {
											reload();
										}}
									/>
									)
								})}
							</TableBody>
							</Table>
						</div>
					)}
				</div>
			</ScrollArea>

			{visibleDialog.kind === 'assign' && dialogAgent ? (
				<AgentAssignToProjectDialog
					open={dialog.kind === 'assign'}
					agentId={dialogAgent.id}
					onOpenChange={(o) => { if (!o) setDialog({ kind: 'closed' }); }}
					excludeProjectIds={dialogAgent.projectIds}
					loadProjects={async () => {
						const list = await listProjects().catch(() => [] as Project[]);
						return list
							.filter((p) => !p.archived)
							.map((p) => ({ id: p.id, name: p.name }));
					}}
					onSelect={async (projectId) => {
						const result = await assignAgentToProject({
							projectId,
							agentId: dialogAgent.id,
						});
						if (result.ok) {
							reload();
						}
						return result;
					}}
				/>
			) : null}

			{visibleDialog.kind === 'remove' ? (
				<UnassignAgentDialog
					open={dialog.kind === 'remove'}
					agentName={visibleDialog.agentName}
					onCancel={() => setDialog({ kind: 'closed' })}
					onConfirm={async () => {
						const result = await removeAgentFromProject({
							projectId: visibleDialog.projectId,
							agentId: visibleDialog.agentId,
						});
						setDialog({ kind: 'closed' });
						if (result.ok) {
							reload();
						}
					}}
				/>
			) : null}

			{visibleDialog.kind === 'delete' && dialogAgent ? (
				<DeleteAgentDialog
					open={dialog.kind === 'delete'}
					agentName={dialogAgent.name}
					onCancel={() => setDialog({ kind: 'closed' })}
					onConfirm={async () => {
						const result = await deleteAgent(dialogAgent.id);
						setDialog({ kind: 'closed' });
						if (result.ok) {
							setAgents((prev) => prev.filter((a) => a.id !== dialogAgent.id));
						}
					}}
				/>
			) : null}
		</div>
	);
}
