import { Icon } from "@/components/ui/icon";
import { WarningIcon, ArrowsClockwiseIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { deleteAgent } from '@/flows/agents/crud/delete-agent';

interface AgentErrorProps {
  lastError?: string;
  onRestart: () => void;
  agentId: string;
}

export function AgentError({ lastError, onRestart, agentId }: AgentErrorProps) {
  const navigate = useNavigate();

  const onDelete = async () => {
    const result = await deleteAgent(agentId);
    if (result.ok) {
      navigate('/');
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center gap-4 px-6 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <Icon icon={WarningIcon} className="size-6 text-destructive" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium text-foreground">Runtime error</h2>
          {lastError && (
            <p className="text-xs font-mono text-muted-foreground break-words max-w-sm">
              {lastError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRestart} className="gap-1.5">
            <Icon icon={ArrowsClockwiseIcon} className="size-3.5" />
            Restart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Icon icon={TrashIcon} className="size-3.5" />
            Delete Agent
          </Button>
        </div>
      </div>
    </div>
  );
}