import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Send } from 'lucide-react';
import { ConversationArea } from './components/ConversationArea';
import { AgentEmpty } from './components/AgentEmpty';
import { AgentInitializing } from './components/AgentInitializing';
import { AgentError } from './components/AgentError';
import { AgentStopped } from './components/AgentStopped';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAgentRuntime } from '@/flows/agents/runtime/use-agent-runtime';

export function AgentChatView() {
  const { agentId } = useParams();
  const {
    agent,
    status,
    messages,
    lastError,
    bootStep,
    loading,
    send,
    restart,
  } = useAgentRuntime(agentId);

  const [input, setInput] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  if (!agentId) return <AgentEmpty />;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="size-5 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70 animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  if (status === 'initializing') {
    return <AgentInitializing currentStep={bootStep} agentName={agent.name} lastError={lastError} onRestart={restart} />;
  }

  if (status === 'error') {
    return <AgentError lastError={lastError} onRestart={restart} agentId={agent.id} />;
  }

  if (status === 'stopped') {
    return <AgentStopped onStart={restart} />;
  }

  const isLive = status === 'running' || status === 'busy';
  const isBusy = status === 'busy';

  const onSend = () => {
    const text = input.trim();
    if (!text || !isLive) return;
    send(text);
    setInput('');
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ConversationArea messages={messages} busy={isBusy} />
      <div className="shrink-0">
        <div className="max-w-4xl mx-auto px-14 py-4">
          <div className="rounded-2xl bg-sidebar-accent">
            <Textarea
              ref={textareaRef}
              placeholder="Ask your digital employee…"
              className="!bg-transparent min-h-0 w-full rounded-2xl px-4 py-4 text-[20px] leading-normal text-foreground/90 placeholder:text-muted-foreground border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none resize-none"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
            />
            <div className="flex items-center justify-between px-3 pb-3 -mt-1">
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground h-8 w-8 border-0"
              >
                <Plus className="size-5" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={onSend}
                disabled={isBusy || input.trim().length === 0}
                className="text-muted-foreground hover:text-foreground h-8 w-8 border-0"
              >
                <Send className="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}