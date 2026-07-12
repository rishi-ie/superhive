import { Button } from '@/components/ui/button';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { Icon } from '@/components/ui/icon';
import type { Agent } from '@/storage/types';

interface ProjectMembersListProps {
	projectId: string;
	coordinator: Agent | null;
	members: Agent[];
	onAssignClick: () => void;
	onRemove: (agent: Agent) => void;
}

export function ProjectMembersList(props: ProjectMembersListProps) {
	return (
		<div className="flex flex-col gap-stack p-card">
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
						<span className="text-[11px] text-muted-foreground">{a.status}</span>
					</div>
					<Button
						size="icon"
						variant="ghost"
						onClick={() => props.onRemove(a)}
						aria-label={`Remove ${a.name}`}
					>
						<Icon icon={XIcon} className="size-3.5" />
					</Button>
				</div>
			))}
		</div>
	);
}