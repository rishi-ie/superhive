import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from "@/components/ui/icon";
import { PlusIcon, ArrowUpIcon, Stop } from "@phosphor-icons/react";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Mic02Icon } from "@hugeicons/core-free-icons";
import { ConversationArea } from './components/ConversationArea';
import { AgentEmpty } from './components/AgentEmpty';
import { AgentBooting } from './components/AgentBooting';
import { AgentError } from './components/AgentError';
import { AgentStopped } from './components/AgentStopped';
import { AgentWaiting } from './components/AgentWaiting';
import { ModelPicker } from '@/components/layout/composer/ModelPicker';
import { ContextUsageRing } from '@/components/layout/composer/ContextUsageRing';
import { ChatComposerFrame, ChatComposerToolbar, composerIconButtonClass, composerSendButtonClass, composerTextareaClass, useComposerTextareaAutosize } from '@/components/layout/composer/ChatComposer';
import { useAgentRuntime } from '@/flows/agents/runtime';
import { useAgentSettings } from '@/flows/agents/settings';
import { useChatShortcuts } from '@/flows/ui/use-chat-shortcuts';
import { sendMessage } from '@/flows/ui/send-message';
import { shortcutCopyLastAssistant } from '@/flows/ui/shortcut-copy-last-assistant';

export function AgentChatView() {
  const { agentId } = useParams();
  const {
    agent,
    status,
    messages,
    inFlight,
    lastError,
    bootStep,
    contextUsage,
    availableModels,
    activeModelContextWindow,
    compaction,
    retry,
    pendingTurn,
    agentResponseActive,
    loading,
    send,
    stop,
    restart,
  } = useAgentRuntime(agentId);
  const agentSettings = useAgentSettings(agentId ?? null);
  const selectedContextWindow = React.useMemo(() => {
    const provider = agentSettings.settings?.model?.provider;
    const name = agentSettings.settings?.model?.name;
    if (!provider || !name || !availableModels) return undefined;
    // Case-insensitive on both fields: settings files often carry display
    // casing that differs from Pi's registry keys (e.g. provider "Minimax"
    // vs catalog "minimax"; model id "Minimax-M3" vs catalog "MiniMax-M3").
    // Without the lowercase, the lookup misses and the ring falls through
    // to the unknown-window state — or, worse, to contextUsage.contextWindow
    // which can be a stale or wrong value from a partial applyModel.
    const providerLc = provider.toLowerCase();
    const nameLc = name.toLowerCase();
    return availableModels.find(
      (m) => m.provider.toLowerCase() === providerLc && m.id.toLowerCase() === nameLc,
    )?.contextWindow;
  }, [agentSettings.settings?.model?.provider, agentSettings.settings?.model?.name, availableModels]);
  const contextWindow = React.useMemo(() => {
    // 1. Pi's catalog — always authoritative for the canonical model
    //    context window. The catalog comes from modelRegistry.getAvailable()
    //    via the `models` telemetry event.
    if (selectedContextWindow) return selectedContextWindow;
    // 2. Pi's getContextUsage() — the live session model's window.
    //    Available once a context telemetry event has fired.
    if (contextUsage?.contextWindow && contextUsage.contextWindow > 0) return contextUsage.contextWindow;
    // 3. Last resort: the value reported on model_select.
    if (activeModelContextWindow && activeModelContextWindow > 0) return activeModelContextWindow;
    return undefined;
  }, [selectedContextWindow, contextUsage?.contextWindow, activeModelContextWindow]);
  // Tokens come from Pi's getContextUsage() only. usage.input updates on every
  // message_update during streaming and approximates the re-sent context window
  // size — using it here causes the ring to drift mid-response, which is the
  // timer-like behaviour we want to avoid. The ring now moves only when Pi
  // reports a new context snapshot (session_start, agent_end, input,
  // model_select, session_compact).
  const contextUsedTokens = contextUsage?.tokens ?? 0;
  const contextPercent =
    contextWindow != null && contextWindow > 0 && contextUsedTokens > 0
      ? Math.min(100, (contextUsedTokens / contextWindow) * 100)
      : 0;

  const [input, setInput] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  useComposerTextareaAutosize(textareaRef, input);

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

  if (status === 'waiting') {
    return <AgentWaiting agentName={agent.name} />;
  }

  if (bootStep !== undefined && bootStep !== 'ready') {
    return <AgentBooting agentName={agent.name} lastError={lastError} onRestart={restart} />;
  }

  if (status === 'idle' && lastError) {
    return <AgentError lastError={lastError} onRestart={restart} agentId={agent.id} />;
  }

  if (status === 'idle') {
    return <AgentStopped onStart={restart} />;
  }

  const isLive = status === 'active' || status === 'busy';
  const isBusy = status === 'busy';

  const onSend = () => {
    const result = sendMessage({ text: input, isLive, send: (text) => void send({ text }) })
    if (result.ok) {
      setInput('');
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
      return;
    }
    if (e.key === 'ArrowUp' && !input && messages.length > 0) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUser) {
        e.preventDefault();
        setInput(lastUser.text);
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    }
  };

  useChatShortcuts({
    onCopyLast: () => {
      void shortcutCopyLastAssistant({ messages });
    },
    onStop: () => {
      if (status === 'busy' || status === 'active') void stop();
    },
    enabled: !!agentId && !!agent,
  });

  return (
    <div className="flex flex-1 min-h-0 flex-col [--font-scale:1.025] [--foreground:#D8D8D8] [--muted-foreground:#5B5B5B]">
      <ConversationArea
        messages={messages}
        inFlight={inFlight}
        busy={isBusy}
        compaction={compaction}
        retry={retry}
        onCancel={stop}
        agentId={agentId}
        pendingTurn={pendingTurn}
        agentResponseActive={agentResponseActive}
      />
      <div className="shrink-0">
        <ChatComposerFrame>
          <textarea
            ref={textareaRef}
            placeholder="Ask your digital employee…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
            className={composerTextareaClass}
          />
          <ChatComposerToolbar>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Add attachment" className={composerIconButtonClass}>
                <Icon icon={PlusIcon} className="size-5" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <ContextUsageRing percent={contextPercent} usedTokens={contextUsedTokens} maxTokens={contextWindow} size={18} className="size-8" />
              <ModelPicker agentId={agentId} />
              <button type="button" aria-label="Voice input" className={composerIconButtonClass}>
                <HugeIcon icon={Mic02Icon} size={18} />
              </button>
              <button
                type="button"
                aria-label={isBusy ? 'Stop response' : 'Send message'}
                onClick={isBusy ? stop : onSend}
                disabled={!isBusy && input.trim().length === 0}
                className={`${composerSendButtonClass} ${isBusy ? 'bg-chat-composer-stop-bg hover:bg-chat-composer-stop-hover' : 'bg-chat-composer-send-bg hover:bg-chat-composer-send-hover disabled:bg-muted'}`}
              >
                <Icon icon={isBusy ? Stop : ArrowUpIcon} className="size-5 text-white" />
              </button>
            </div>
          </ChatComposerToolbar>
        </ChatComposerFrame>
      </div>
    </div>
  );
}
