import { useNavigate } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { CaretRightIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TableRow } from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Agent } from '@/types/electron';

const STATUS_DOT: Record<Agent['status'], string> = {
  running: "bg-success",
  busy: "bg-info",
  idle: "bg-muted-foreground/40",
  initializing: "bg-warning",
  stopped: "bg-muted-foreground/30",
  error: "bg-destructive",
};

const STATUS_LABEL: Record<Agent['status'], string> = {
  running: "Running",
  busy: "Busy",
  idle: "Idle",
  initializing: "Initializing",
  stopped: "Stopped",
  error: "Error",
};

interface AgentListRowProps {
  agent: Agent;
  projectName?: string;
}

function initials(name?: string) {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
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

export function AgentListRow({ agent, projectName }: AgentListRowProps) {
  const navigate = useNavigate();
  const updated = relativeTime(agent.updatedAt);

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

  return (
    <TableRow
      onClick={() => navigate(`/agents/${agent.id}`)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      className="group cursor-pointer"
    >
      <TableCell className="w-[260px">
        <div className="flex items-center gap-stack.5">
          <Avatar size="sm">
            <AvatarFallback className="bg-sidebar text-foreground font-medium text-xs">
              {initials(agent.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-foreground text-sm">
            {agent.name}
          </span>
        </div>
      </TableCell>

      <TableCell>
        {agent.role ? (
          <span className="line-clamp-1 text-muted-foreground text-sm">{agent.role}</span>
        ) : (
          <span className="text-muted-foreground/40 text-sm">—</span>
        )}
      </TableCell>

      <TableCell className="w-[140px">
        <div className="flex items-center gap-list-item whitespace-nowrap">
          <div className={cn("size-1.5 rounded-full shrink-0", STATUS_DOT[agent.status])} />
          {agent.status === 'initializing' ? (
            <Icon
              icon={CircleNotchIcon}
              className="size-2.5 animate-spin shrink-0 text-warning"
            />
          ) : null}
          <span className="text-xs text-muted-foreground">
            {STATUS_LABEL[agent.status]}
          </span>
        </div>
      </TableCell>

      <TableCell className="w-[180px">
        <span className="truncate text-sm text-muted-foreground">
          {projectName ?? 'No project'}
        </span>
      </TableCell>

      <TableCell className="w-[160px">
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
}