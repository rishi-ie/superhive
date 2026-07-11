import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { PlusIcon, HandIcon, CaretDownIcon, CaretUpIcon, MicrophoneIcon } from "@phosphor-icons/react";
import { ConversationArea } from './components/ConversationArea';
import { AgentEmpty } from './components/AgentEmpty';
import { AgentInitializing } from './components/AgentInitializing';
import { AgentError } from './components/AgentError';
import { AgentStopped } from './components/AgentStopped';
import { ModelPicker } from '@/components/layout/composer/ModelPicker';
import { useAgentRuntime } from '@/flows/agents/runtime';
import { useAgentSettings } from '@/flows/agents/agent-store';
import { toast } from 'sonner';

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

  // Read the current model selection so we can gate the send button.
  // The composer dropdown is the only picker; if no model is chosen, chat is disabled.
  const agentSettings = useAgentSettings(agentId ?? null);
  const hasModel = Boolean(
    agentSettings.settings?.model?.provider && agentSettings.settings?.model?.name,
  );

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
    // Guard: chat is disabled when no model is selected.
    // The send button is also disabled in this state, but a defensive guard
    // is kept in case the user reaches onSend via keyboard (Enter).
    if (!hasModel) {
      toast.error('Pick a model first');
      return;
    }
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
          <div className="rounded-3xl bg-surface-composer">
            <textarea
              ref={textareaRef}
              placeholder="Ask your digital employee…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
              className="min-h-[24px] w-full resize-none border-0 bg-transparent px-4 pt-3 pb-2 text-sm text-surface-composer-foreground placeholder:text-surface-composer-placeholder outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-4">
                <button className="text-surface-composer-muted hover:text-surface-composer-foreground cursor-default">
                  <Icon icon={PlusIcon} className="size-5" />
                </button>
                <button className="flex items-center gap-1.5 text-sm text-surface-composer-muted hover:text-surface-composer-foreground cursor-default">
                  <Icon icon={HandIcon} className="size-4" />
                  <span>Ask for approval</span>
                  <Icon icon={CaretDownIcon} className="size-3" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <ModelPicker agentId={agentId} />
                <button className="text-surface-composer-muted hover:text-surface-composer-foreground cursor-default">
                  <Icon icon={MicrophoneIcon} className="size-5" />
                </button>
                <button
                  onClick={onSend}
                  disabled={isBusy || input.trim().length === 0 || !hasModel}
                  title={!hasModel ? 'Pick a model first' : undefined}
                  className="flex size-7 items-center justify-center rounded-full bg-surface-control hover:bg-surface-control-hover disabled:bg-surface-control-disabled disabled:cursor-default cursor-default"
                >
                  <Icon icon={CaretUpIcon} className="size-3.5 text-surface-composer-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
