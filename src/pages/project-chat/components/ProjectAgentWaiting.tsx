import { Icon } from "@/components/ui/icon";
import { HourglassIcon } from "@phosphor-icons/react";

interface ProjectAgentWaitingProps {
  agentName?: string;
}

/**
 * Project-side counterpart of `AgentWaiting`. Shown when the project
 * coordinator's runtime is paused waiting for user input or approval.
 */
export function ProjectAgentWaiting({ agentName }: ProjectAgentWaitingProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex max-w-sm flex-col items-center gap-gap-loose px-6 text-center">
        <div className="rounded-full bg-warning/10 p-panel">
          <Icon icon={HourglassIcon} className="size-5 text-warning" />
        </div>
        <h2 className="text-base font-medium text-foreground">Waiting</h2>
        <p className="text-sm text-muted-foreground">
          {agentName
            ? `${agentName} is waiting for your response.`
            : 'The project agent is waiting for your response.'}
        </p>
        <p className="text-xs text-muted-foreground/70">
          Approval and question prompts land here in a follow-up.
        </p>
      </div>
    </div>
  );
}