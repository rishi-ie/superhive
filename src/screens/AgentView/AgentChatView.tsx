import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { agents } from '@/api/agents';
import type { Agent } from '@/storage/types';
import { AgentChatHeader } from './components/AgentChatHeader';
import { AgentEmptyState } from './components/AgentEmptyState';
import { AgentPickerDialog } from './components/AgentPickerDialog';
import { ChatComposer } from '@/screens/ChatView/components/ChatComposer';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export function AgentChatView() {
  const { agentId } = useParams<{ agentId: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!agentId) return;
    agents.get(agentId).then((a) => {
      if (!a) {
        setNotFound(true);
      } else {
        setNotFound(false);
        setAgent(a);
      }
    });
  }, [agentId]);

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#141414] p-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent">
          <Bot className="size-6 text-[#7c3aed]" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-medium text-foreground">Agent not found</div>
          <div className="text-xs text-muted-foreground">
            This agent may have been deleted.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
          <Bot className="size-3.5" /> Browse agents
        </Button>
        <AgentPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center bg-[#141414]">
        <div className="flex size-6 items-center justify-center">
          <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#141414]">
      <AgentChatHeader agent={agent} />
      <AgentEmptyState agentName={agent.name} />
      <ChatComposer />
    </div>
  );
}
