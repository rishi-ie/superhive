import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { LaptopIcon, PlusIcon, MicrophoneIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { ConversationArea } from './components/ConversationArea';
import { AgentEmpty } from './components/AgentEmpty';
import { AgentInitializing } from './components/AgentInitializing';
import { AgentError } from './components/AgentError';
import { AgentStopped } from './components/AgentStopped';
import { ModelPicker } from '@/components/layout/composer/ModelPicker';
import { ContextUsageRing } from '@/components/layout/composer/ContextUsageRing';
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
    usage,
    contextUsage,
    availableModels,
    activeModelContextWindow,
    loading,
    send,
    restart,
  } = useAgentRuntime(agentId);
  const agentSettings = useAgentSettings(agentId ?? null);
  const hasModel = Boolean(
    agentSettings.settings?.model?.provider && agentSettings.settings?.model?.name,
  );
  const selectedContextWindow = React.useMemo(() => {
    const provider = agentSettings.settings?.model?.provider;
    const name = agentSettings.settings?.model?.name;
    if (!provider || !name || !availableModels) return undefined;
    return availableModels.find((m) => m.provider === provider && m.id === name)?.contextWindow;
  }, [agentSettings.settings?.model?.provider, agentSettings.settings?.model?.name, availableModels]);
  const contextWindow = React.useMemo(() => {
    if (selectedContextWindow) return selectedContextWindow;
    if (activeModelContextWindow && activeModelContextWindow > 0) return activeModelContextWindow;
    if (contextUsage?.contextWindow && contextUsage.contextWindow > 0) return contextUsage.contextWindow;
    return undefined;
  }, [selectedContextWindow, activeModelContextWindow, contextUsage?.contextWindow]);
  const contextUsedTokens = contextUsage?.tokens ?? usage?.input ?? 0;
  const contextPercent =
    contextWindow != null && contextWindow > 0 && contextUsedTokens > 0
      ? Math.min(100, (contextUsedTokens / contextWindow) * 100)
      : 0;

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
    <div className="flex flex-1 min-h-0 flex-col">
      <ConversationArea messages={messages} busy={isBusy} />
      <div className="shrink-0">
        <div className="max-w-[800px] mx-auto px-14 py-4">
          <div className="flex items-start">
            <div className="flex-1 rounded-3xl bg-sidebar">
              <textarea
                ref={textareaRef}
                placeholder="Ask your digital employee…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
                className="min-h-[24px] w-full resize-none border-0 bg-transparent px-composer pt-4 pb-2 text-sm text-sidebar-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex items-center justify-between px-composer py-button-y">
                <div className="flex items-center gap-3">
                  <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-default">
                    <Icon icon={PlusIcon} className="size-5" />
                  </button>
                  <ContextUsageRing
                    percent={contextPercent}
                    usedTokens={contextUsedTokens}
                    maxTokens={contextWindow}
                  />
                  <div className="flex items-center gap-1 text-sidebar-foreground/70">
                    <Icon icon={LaptopIcon} className="size-4" />
                    <span className="text-xs">Local</span>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <ModelPicker agentId={agentId} />
                  <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-default">
                    <Icon icon={MicrophoneIcon} className="size-5" />
                  </button>
                  <button
                    onClick={onSend}
                    disabled={isBusy || input.trim().length === 0 || !hasModel}
                    title={!hasModel ? 'Pick a model first' : undefined}
                    className="flex size-7 items-center justify-center rounded-full bg-secondary hover:bg-accent disabled:bg-muted disabled:cursor-default cursor-default"
                  >
                    <Icon icon={ArrowUpIcon} className="size-3.5 text-sidebar-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
