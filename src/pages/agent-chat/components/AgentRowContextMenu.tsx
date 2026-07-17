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
	PlayIcon,
	PowerIcon,
	ProhibitIcon,
	TextOutdentIcon,
	TrashIcon,
} from '@phosphor-icons/react';
import type { Agent } from '@/types/electron'
import type { ReactNode } from 'react';
import { revealAgent } from '@/flows/agents/crud';
import {
	startAgent,
	stopAgent,
	restartAgent,
} from '@/flows/agents/runtime';

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

const STOPPABLE = new Set<Agent['status']>(['active', 'busy']);
const STARTABLE = new Set<Agent['status']>(['idle']);
const RESTART_SKIPPED: ReadonlySet<Agent['status']> = new Set();

export function AgentRowContextMenu(props: AgentRowContextMenuProps) {
	const navigate = useNavigate();
	const { agent } = props;
	const hasProject = agent.projectIds.length > 0;

	function copyId() {
		navigator.clipboard.writeText(agent.id).catch(() => {});
	}

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				{props.children}
			</ContextMenuTrigger>
			<ContextMenuContent className="min-w-56">
				<ContextMenuItem onSelect={() => navigate(`/agents/${agent.id}`)}>
					<TextOutdentIcon /> Open chat
				</ContextMenuItem>
				{props.onEditName ? (
					<ContextMenuItem onSelect={props.onEditName}>
						<PencilSimpleIcon /> Edit name
					</ContextMenuItem>
				) : null}
				<ContextMenuSeparator />
				<ContextMenuItem
					disabled={!STARTABLE.has(agent.status)}
					onSelect={() => startAgent(agent.id)}
				>
					<PlayIcon /> Start
				</ContextMenuItem>
				<ContextMenuItem
					disabled={!STOPPABLE.has(agent.status)}
					onSelect={() => stopAgent(agent.id)}
				>
					<PowerIcon /> Stop
				</ContextMenuItem>
				<ContextMenuItem
					disabled={RESTART_SKIPPED.has(agent.status)}
					onSelect={() => restartAgent(agent.id)}
				>
					<ProhibitIcon /> Restart
				</ContextMenuItem>
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
