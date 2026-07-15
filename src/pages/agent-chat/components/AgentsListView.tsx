import * as React from 'react';
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
import type { Agent, Project } from '@/types/electron';

type DialogKind =
	| { kind: 'closed' }
	| { kind: 'assign'; agentId: string }
	| { kind: 'remove'; agentId: string; projectId: string; agentName: string; live: boolean }
	| { kind: 'delete'; agentId: string; agentName: string };

export function AgentsListView() {
	const [agents, setAgents] = React.useState<Agent[]>([]);
	const [projectsById, setProjectsById] = React.useState<Record<string, Project>>({});
	const [loading, setLoading] = React.useState(true);
	const [filter, setFilter] = React.useState('');
	const [dialog, setDialog] = React.useState<DialogKind>({ kind: 'closed' });
	const { setOpen: setCreateOpen } = useOpenCreateAgent();

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
	}, [reload]);

	const nonCoordinators = React.useMemo(
		() => agents.filter((a) => a.agentKind !== 'project-coordinator'),
		[agents],
	);

	const filtered = React.useMemo(() => {
		const q = filter.trim().toLowerCase();
		if (!q) return nonCoordinators;
		return nonCoordinators.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.role?.toLowerCase().includes(q) ||
				a.description?.toLowerCase().includes(q),
		);
	}, [nonCoordinators, filter]);

	const projectFor = (agent: Agent): { id: string; name: string } | null => {
		const firstId = agent.projectIds[0];
		if (!firstId) return null;
		const p = projectsById[firstId];
		if (!p) return null;
		return { id: p.id, name: p.name };
	};

	const parentDir = `~/.superhive/agents`;

	const liveStatuses = new Set<Agent['status']>(['initializing', 'running', 'busy']);

	const dialogAgent =
		dialog.kind === 'assign' || dialog.kind === 'delete'
			? agents.find((a) => a.id === dialog.agentId) ?? null
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
								<TableBody>
									{filtered.map((agent) => (
										<AgentListRow
											key={agent.id}
											agent={agent}
											project={projectFor(agent)}
											parentDir={parentDir}
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
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</ScrollArea>

			{dialog.kind === 'assign' && dialogAgent ? (
				<AgentAssignToProjectDialog
					open
					agentId={dialogAgent.id}
					onOpenChange={() => setDialog({ kind: 'closed' })}
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

			{dialog.kind === 'remove' ? (
				<UnassignAgentDialog
					open
					agentName={dialog.agentName}
					onCancel={() => setDialog({ kind: 'closed' })}
					onConfirm={async () => {
						const result = await removeAgentFromProject({
							projectId: dialog.projectId,
							agentId: dialog.agentId,
						});
						setDialog({ kind: 'closed' });
						if (result.ok) {
							reload();
						}
					}}
				/>
			) : null}

			{dialog.kind === 'delete' && dialogAgent ? (
				<DeleteAgentDialog
					open
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
