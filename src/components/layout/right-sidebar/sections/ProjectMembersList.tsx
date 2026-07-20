import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { Icon } from '@/components/ui/icon';
import { AgentStatusBadge } from '@/components/common';
import type { Agent } from '@/storage/types';
import { UnassignAgentDialog } from './UnassignAgentDialog';

interface ProjectMembersListProps {
	projectId: string;
	coordinator: Agent | null;
	members: Agent[];
	onAssignClick: () => void;
	onRemove: (agent: Agent) => void;
}

export function ProjectMembersList(props: ProjectMembersListProps) {
	const [pendingRemove, setPendingRemove] = useState<Agent | null>(null);

	return (
		<div className="flex flex-col gap-stack">
			<div className="flex items-center justify-between">
				<span className="text-sm font-semibold">Team</span>
				<Button size="sm" variant="outline" onClick={props.onAssignClick}>
					<Icon icon={PlusIcon} className="size-3.5" />
					Assign agent
				</Button>
			</div>
			{props.coordinator && (
				<div className="flex items-center justify-between rounded-button border border-border bg-card px-row py-2">
					<div className="flex flex-col gap-0.5">
						<span className="text-sm">{props.coordinator.name}</span>
						<span className="text-[11px] text-muted-foreground">Coordinator</span>
					</div>
				</div>
			)}
			{props.members.map((a) => (
				<div
					key={a.id}
					className="flex items-center justify-between rounded-button border border-border bg-card px-row py-2"
				>
					<div className="flex flex-col gap-0.5">
						<span className="text-sm">{a.name}</span>
						<AgentStatusBadge
							status={a.status}
							error={Boolean(a.lastError)}
							compact
						/>
					</div>
					<Button
						size="icon"
						variant="ghost"
						onClick={() => {
							if (a.status === 'active' || a.status === 'busy' || a.status === 'waiting') {
								setPendingRemove(a);
							} else {
								props.onRemove(a);
							}
						}}
						aria-label={`Remove ${a.name}`}
					>
						<Icon icon={XIcon} className="size-3.5" />
					</Button>
				</div>
			))}
			{props.members.length === 0 && props.coordinator && (
				<span className="text-xs text-muted-foreground">No additional agents assigned.</span>
			)}
			{props.members.length === 0 && !props.coordinator && (
				<span className="text-xs text-muted-foreground">No agents yet</span>
			)}
			<UnassignAgentDialog
				open={!!pendingRemove}
				agentName={pendingRemove?.name ?? null}
				onConfirm={() => {
					if (pendingRemove) props.onRemove(pendingRemove);
					setPendingRemove(null);
				}}
				onCancel={() => setPendingRemove(null)}
			/>
		</div>
	);
}