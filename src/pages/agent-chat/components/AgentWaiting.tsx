import { Icon } from "@/components/ui/icon";
import { HourglassIcon } from "@phosphor-icons/react";

interface AgentWaitingProps {
  agentName?: string;
}

/**
 * Shown when the runtime is paused waiting for user input or approval.
 * The status value exists today but no adapter event produces it yet —
 * the corresponding event handling will land in a follow-up. This
 * component is a placeholder so the chat view can branch on `waiting`
 * without a runtime-side fallback path.
 */
export function AgentWaiting({ agentName }: AgentWaitingProps) {
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
            : 'The agent is waiting for your response.'}
        </p>
        <p className="text-xs text-muted-foreground/70">
          Approval and question prompts land here in a follow-up.
        </p>
      </div>
    </div>
  );
}