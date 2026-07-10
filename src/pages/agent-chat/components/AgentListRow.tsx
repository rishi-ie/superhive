import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { ArrowRight01Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_DOT, STATUS_LABEL } from './AgentCard';
import type { Agent } from '@/types/electron';

interface AgentListRowProps {
  agent: Agent;
  projectName?: string;
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const isCoordinator = agent.agentKind === 'project-coordinator';
  const updated = relativeTime(agent.updatedAt);

  const metaParts: string[] = [];
  if (agent.taskIds.length > 0) {
    metaParts.push(`${agent.taskIds.length} ${agent.taskIds.length === 1 ? 'task' : 'tasks'}`);
  }
  if (agent.sessionIds.length > 0) {
    metaParts.push(`${agent.sessionIds.length} ${agent.sessionIds.length === 1 ? 'session' : 'sessions'}`);
  }
  if (updated) metaParts.push(`Updated ${updated}`);

  return (
    <button
      type="button"
      onClick={() => navigate(`/agents/${agent.id}`)}
      className="group flex w-full cursor-default items-center gap-4 border-b border-border/40 px-2 py-3 text-left transition-colors hover:bg-accent/40"
    >
      <Avatar size="lg">
        <AvatarFallback className="bg-sidebar text-foreground font-medium">
          {initials(agent.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {agent.name}
          </span>
          {isCoordinator && (
            <Badge variant="outline" className="h-4 px-1.5 py-0 text-[0.5625rem]">
              Coordinator
            </Badge>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <div className={cn("size-1.5 rounded-full", STATUS_DOT[agent.status])} />
            {agent.status === 'initializing' ? (
              <HugeiconsIcon
                icon={Loading01Icon}
                className="size-2.5 animate-spin text-yellow-500"
              />
            ) : null}
            <span className="text-xs text-muted-foreground">
              {STATUS_LABEL[agent.status]}
            </span>
          </div>
        </div>

        {agent.role && (
          <span className="truncate text-xs text-muted-foreground">
            {agent.role}
          </span>
        )}

        {(metaParts.length > 0 || projectName) && (
          <div className="flex items-center gap-3 truncate text-xs text-muted-foreground/70">
            {metaParts.length > 0 && <span>{metaParts.join(' · ')}</span>}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="max-w-[140px] truncate text-xs text-muted-foreground">
          {isCoordinator ? 'Manages project' : (projectName ?? 'No project')}
        </span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="size-3.5 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
        />
      </div>
    </button>
  );
}