import { Bot } from 'lucide-react';
import { ChatView } from '@/screens/ChatView';
import { usePicker } from '@/providers/picker-provider';
import { useAgents } from '@/hooks/use-agents';

export function AgentView() {
  const { selectedAgentId, selectedAgentName } = usePicker();
  const { data: agents = [], isLoading } = useAgents();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#141414] text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!selectedAgentId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#141414] p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent">
          <Bot className="size-6 text-[#7c3aed]" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-medium text-foreground">No agent selected</div>
          <div className="text-xs text-muted-foreground">
            Click <span className="text-muted-foreground/70">Agent view</span> in the sidebar to pick one.
          </div>
        </div>
      </div>
    );
  }

  return <ChatView category="agent" agentName={selectedAgentName ?? agents.find(a => a.id === selectedAgentId)?.name ?? 'Agent'} />;
}
