import { Bot } from 'lucide-react';

interface AgentEmptyStateProps {
  agentName: string;
}

export function AgentEmptyState({ agentName }: AgentEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <Bot className="size-6 text-[#7c3aed]" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="text-sm font-medium text-foreground">
          No messages yet
        </div>
        <div className="text-xs text-muted-foreground">
          Send a message to start a session with {agentName}.
        </div>
      </div>
    </div>
  );
}
