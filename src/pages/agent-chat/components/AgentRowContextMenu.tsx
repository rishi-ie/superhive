import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  CopyIcon,
  FolderOpenIcon,
  LinkIcon,
  PencilSimpleIcon,
  ProhibitIcon,
  TextOutdentIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import type { Agent } from '@/types/electron'
import type { ReactNode } from 'react';
import { revealAgent } from '@/flows/agents/crud';
import { goToAgent } from '@/flows/navigation';
import { copyAgentId } from '@/flows/ui/copy-agent-id';

interface AgentRowContextMenuProps {
	agent: Agent;
	parentDir: string;
	onOpenAssignProject: () => void;
	onOpenRemoveProject: () => void;
	onOpenDelete: () => void;
	onEditName?: () => void;
	onForked?: (id: string) => void;
	children: ReactNode;
}

export function AgentRowContextMenu(props: AgentRowContextMenuProps) {
	const navigate = useNavigate();
	const { agent } = props;
	const hasProject = agent.projectIds.length > 0;

	function copyId() {
		void copyAgentId(agent.id);
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				{props.children}
			</ContextMenuTrigger>
			<ContextMenuContent className="min-w-56">
				<ContextMenuItem onSelect={() => goToAgent(navigate, agent.id)}>
					<TextOutdentIcon /> Open chat
				</ContextMenuItem>
				{props.onEditName ? (
					<ContextMenuItem onSelect={props.onEditName}>
						<PencilSimpleIcon /> Edit name
					</ContextMenuItem>
				) : null}
				<ContextMenuSeparator />
				{!hasProject ? (
					<ContextMenuItem onSelect={props.onOpenAssignProject}>
						<LinkIcon /> Add to project
					</ContextMenuItem>
				) : (
					<ContextMenuItem onSelect={props.onOpenRemoveProject}>
						<ProhibitIcon /> Remove from project
					</ContextMenuItem>
				)}
				<ContextMenuSeparator />
				<ContextMenuItem onSelect={copyId}>
					<CopyIcon /> Copy agent ID
				</ContextMenuItem>
				<ContextMenuItem
					disabled={!agent.localPath}
					onSelect={() => revealAgent(agent.id)}
				>
					<FolderOpenIcon /> Reveal in Finder
				</ContextMenuItem>
				<ContextMenuSeparator />
				<ContextMenuItem variant="destructive" onSelect={props.onOpenDelete}>
					<TrashIcon /> Delete agent
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}
