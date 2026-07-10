import { Icon } from "@/components/ui/icon";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';

interface AgentStoppedProps {
  onStart: () => void;
}

export function AgentStopped({ onStart }: AgentStoppedProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
        <div className="rounded-full bg-muted/40 p-3">
          <Icon icon={PauseIcon} className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-base font-medium text-foreground">Agent stopped</h2>
        <p className="text-sm text-muted-foreground">
          The runtime is not running. Start it to resume chatting.
        </p>
        <Button size="sm" onClick={onStart} className="mt-1 gap-1.5">
          <Icon icon={PlayIcon} className="size-3.5" />
          Start Runtime
        </Button>
      </div>
    </div>
  );
}