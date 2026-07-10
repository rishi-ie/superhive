import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { AiBrain01Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Agent } from '@/types/electron';

interface AgentCardProps {
  agent: Agent;
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

const STATUS_DOT: Record<Agent['status'], string> = {
  running: "bg-green-500",
  busy: "bg-blue-500",
  idle: "bg-muted-foreground/40",
  initializing: "bg-yellow-500",
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

export function AgentCard({ agent }: AgentCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/agents/${agent.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/agents/${agent.id}`);
        }
      }}
      className="cursor-default transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start gap-3 px-3 pt-3">
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
            {agent.agentKind === 'project-coordinator' && (
              <Badge variant="outline" className="h-4 px-1.5 py-0 text-[0.5625rem]">
                Coordinator
              </Badge>
            )}
          </div>

          {agent.role && (
            <span className="truncate text-xs text-muted-foreground">
              {agent.role}
            </span>
          )}
        </div>

        <HugeiconsIcon
          icon={AiBrain01Icon}
          className="size-4 shrink-0 text-muted-foreground/40"
        />
      </div>

      {agent.description && (
        <div className="px-3 pt-2">
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {agent.description}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border/50 px-3 pt-2 pb-3">
        <div className="flex items-center gap-1.5">
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

        <span className="text-xs text-muted-foreground">
          {agent.projectIds.length} {agent.projectIds.length === 1 ? 'project' : 'projects'}
        </span>
      </div>
    </Card>
  );
}