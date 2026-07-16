import { useEffect, useState } from 'react';
import { Icon } from "@/components/ui/icon";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';

interface AgentInitializingProps {
  agentName?: string;
  lastError?: string;
  onRestart: () => void;
}

const STUCK_THRESHOLD_MS = 90_000;

export function AgentInitializing({ agentName, lastError, onRestart }: AgentInitializingProps) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStuck(true), STUCK_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          {agentName ? `Loading ${agentName}…` : 'Loading…'}
        </p>

        {stuck && (
          <>
            <p className="text-sm text-muted-foreground">
              This is taking longer than usual.
            </p>
            {lastError && (
              <p className="text-xs font-mono text-destructive max-w-sm break-words">
                {lastError}
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onRestart}
              className="mt-2 gap-2"
            >
              <Icon icon={ArrowsClockwiseIcon} className="size-3.5" />
              Restart
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
