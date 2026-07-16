import { Link, useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { CaretRightIcon } from "@phosphor-icons/react";
import { TableRow } from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import { AgentStatusBadge } from '@/components/common';
import type { Agent, InitStep, AgentStatus } from '@/types/electron';
import { AgentRowContextMenu } from './AgentRowContextMenu';

interface ProjectRef {
	id: string;
	name: string;
}

interface AgentListRowProps {
	agent: Agent;
	project?: ProjectRef | null;
	parentDir: string;
	/** Live runtime status + bootStep, used to overlay the DB snapshot. */
	liveStatus?: AgentStatus;
	liveBootStep?: InitStep;
	onOpenAssignProject: (agentId: string) => void;
	onOpenRemoveProject: (agentId: string, projectIdHint?: string | null) => void;
	onOpenDelete: (agentId: string) => void;
	onForked?: (id: string) => void;
}

function relativeTime(timestamp?: number): string | null {
  if (!timestamp) return null;
  const diff = Date.now() - timestamp;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mon = Math.floor(day / 30);
  return `${mon}mo ago`;
}

export function AgentListRow({
  agent,
  project,
  parentDir,
  liveStatus,
  liveBootStep,
  onOpenAssignProject,
  onOpenRemoveProject,
  onOpenDelete,
  onForked,
}: AgentListRowProps) {
  const navigate = useNavigate();
  const updated = relativeTime(agent.updatedAt);

  const status: AgentStatus = liveStatus ?? agent.status;
  const booting =
    status === 'active' && liveBootStep !== undefined && liveBootStep !== 'ready';

  const activityParts: string[] = [];
  if (agent.taskIds.length > 0) {
    activityParts.push(`${agent.taskIds.length} ${agent.taskIds.length === 1 ? 'task' : 'tasks'}`);
  }
  if (agent.sessionIds.length > 0) {
    activityParts.push(`${agent.sessionIds.length} ${agent.sessionIds.length === 1 ? 'session' : 'sessions'}`);
  }
  const activityText = activityParts.length > 0 ? activityParts.join(' · ') : '—';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/agents/${agent.id}`);
    }
  };

  const row = (
    <TableRow
      onClick={() => navigate(`/agents/${agent.id}`)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className="group cursor-pointer"
    >
      <TableCell className="w-[260px]">
        <span className="truncate font-medium text-foreground text-sm">
          {agent.name}
        </span>
      </TableCell>

      <TableCell>
        {agent.role ? (
          <span className="line-clamp-1 text-muted-foreground text-sm">{agent.role}</span>
        ) : (
          <span className="text-muted-foreground/40 text-sm">—</span>
        )}
      </TableCell>

      <TableCell className="w-[140px]">
        <AgentStatusBadge
          status={status}
          error={Boolean(agent.lastError)}
          booting={booting}
        />
      </TableCell>

      <TableCell className="w-[180px]">
        {project ? (
          <Link
            to={`/projects/${project.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-muted-foreground"
          >
            {project.name}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">No project</span>
        )}
      </TableCell>

      <TableCell className="w-[160px]">
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {activityText}
        </span>
      </TableCell>

      <TableCell className="w-[100px text-right">
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {updated ?? '—'}
        </span>
      </TableCell>

      <TableCell className="w-10 text-right">
        <Icon
          icon={CaretRightIcon}
          className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
        />
      </TableCell>
    </TableRow>
  );

	return (
		<AgentRowContextMenu
			agent={agent}
			parentDir={parentDir}
			onOpenAssignProject={() => onOpenAssignProject(agent.id)}
			onOpenRemoveProject={() => onOpenRemoveProject(agent.id, project?.id)}
			onOpenDelete={() => onOpenDelete(agent.id)}
			onForked={onForked}
		>
			{row}
		</AgentRowContextMenu>
	);
}
