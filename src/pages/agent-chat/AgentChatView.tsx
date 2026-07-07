import * as React from 'react';
import { useParams } from 'react-router-dom';
import { HugeiconsIcon } from "@/components/ui/icon";
import { PlusSignIcon, HandIcon, ArrowDown01Icon, ArrowUp01Icon, Mic01Icon } from "@hugeicons/core-free-icons";
import { ConversationArea } from './components/ConversationArea';
import { AgentEmpty } from './components/AgentEmpty';
import { AgentInitializing } from './components/AgentInitializing';
import { AgentError } from './components/AgentError';
import { AgentStopped } from './components/AgentStopped';
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
        <div className="max-w-[800px] mx-auto px-14 py-4">
          <div className="rounded-3xl bg-[#2a2a2a]">
            <textarea
              ref={textareaRef}
              placeholder="Ask your digital employee…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
              className="min-h-[48px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm text-white placeholder:text-[#6b7280] outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-4">
                <button className="text-[#9ca3af] hover:text-white cursor-default">
                  <HugeiconsIcon icon={PlusSignIcon} className="size-5" />
                </button>
                <button className="flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-white cursor-default">
                  <HugeiconsIcon icon={HandIcon} className="size-4" />
                  <span>Ask for approval</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-sm text-[#9ca3af] hover:text-white cursor-default">
                  <span>5.5 Extra High</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" />
                </button>
                <button className="text-[#9ca3af] hover:text-white cursor-default">
                  <HugeiconsIcon icon={Mic01Icon} className="size-5" />
                </button>
                <button
                  onClick={onSend}
                  disabled={isBusy || input.trim().length === 0}
                  className="flex size-7 items-center justify-center rounded-full bg-[#555555] hover:bg-[#666666] disabled:bg-[#333] disabled:cursor-default cursor-default"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5 text-[#222222]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
