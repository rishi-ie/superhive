/**
 * Forked from `src/pages/agent-chat/components/AgentStopped`.
 *
 * Project-agent runtimes are intentionally forked from agent runtimes
 * so they can evolve independently. If you change the stopped UX here,
 * also check `AgentStopped` and decide whether to keep them in sync.
 */

import { Icon } from "@/components/ui/icon";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';

interface ProjectAgentStoppedProps {
  onStart: () => void;
}

export function ProjectAgentStopped({ onStart }: ProjectAgentStoppedProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-sm flex-col items-center gap-gap-loose px-6 text-center">
        <div className="rounded-full bg-muted/40 p-panel">
          <Icon icon={PauseIcon} className="size-5 text-muted-foreground" />
        </div>
        <h2 className="text-base font-medium text-foreground">Project agent stopped</h2>
        <p className="text-sm text-muted-foreground">
          The project coordinator's runtime is not running. Start it to resume chatting.
        </p>
        <Button size="sm" onClick={onStart} className="mt-1 gap-gap-tight.5">
          <Icon icon={PlayIcon} className="size-3.5" />
          Start Runtime
        </Button>
      </div>
    </div>
  );
}