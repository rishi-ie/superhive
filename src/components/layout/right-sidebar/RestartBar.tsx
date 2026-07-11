import { Icon } from "@/components/ui/icon";
import { ArrowsClockwiseIcon, StopIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { restartAgent } from '@/flows/agents/runtime/restart-agent';
import { stopAgent } from '@/flows/agents/runtime/stop-agent';
import type { AgentStatus } from '@/storage/types';

interface RestartBarProps {
  agentId: string;
  status: AgentStatus;
}

const STOPPABLE: Record<AgentStatus, boolean> = {
  running: true,
  busy: true,
  initializing: false,
  idle: false,
  stopped: false,
  error: false,
};

export function RestartBar({ agentId, status }: RestartBarProps) {
  const canStop = STOPPABLE[status] ?? false;

  return (
    <div className="flex items-center justify-between border-t border-sidebar-border py-button-y">
      <span className="text-xs text-muted-foreground">Live runtime</span>
      <div className="flex items-center gap-list-item">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-list-item text-xs"
          onClick={() => void stopAgent(agentId)}
          disabled={!canStop}
        >
          <Icon icon={StopIcon} className="size-3.5" />
          Stop
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-list-item text-xs"
          onClick={() => void restartAgent(agentId)}
          disabled={status === 'initializing'}
        >
          <Icon icon={ArrowsClockwiseIcon} className="size-3.5" />
          Restart
        </Button>
      </div>
    </div>
  );
}
