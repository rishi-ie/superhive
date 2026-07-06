import { HugeiconsIcon } from "@/components/ui/icon";
import { RefreshIcon, SquareIcon } from "@hugeicons/core-free-icons";
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
    <div className="flex items-center justify-between border-t border-sidebar-border px-3 py-2">
      <span className="text-xs text-muted-foreground">Live runtime</span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => void stopAgent(agentId)}
          disabled={!canStop}
        >
          <HugeiconsIcon icon={SquareIcon} className="size-3.5" />
          Stop
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => void restartAgent(agentId)}
          disabled={status === 'initializing'}
        >
          <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
          Restart
        </Button>
      </div>
    </div>
  );
}
