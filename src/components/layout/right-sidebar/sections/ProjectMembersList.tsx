import { Button } from '@/components/ui/button';
import { PlusIcon } from '@phosphor-icons/react';
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
			<span className="text-xs text-muted-foreground">No agents yet</span>
		</div>
	);
}