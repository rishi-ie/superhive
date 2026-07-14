/**
 * ProjectChatView — project-coordinator chat surface.
 *
 * Mirrors `AgentChatView` structure exactly: same textarea/input chrome,
 * same ConversationArea usage, same runtime hook (`useAgentRuntime`).
 *
 * The only project-specific bits:
 *   1. Resolve `project → projectAgent` from `projectId` on mount
 *   2. Use forked state components (`ProjectAgentInitializing/Error/Stopped/Empty`)
 *      so project-agent lifecycle UX can evolve independently from standard agents
 *
 * Shared runtime infrastructure (`useAgentRuntime`, `agent-store`) is generic
 * and works for both agent kinds.
 */

import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import {
  PlusIcon,
  ArrowUpIcon,
  LaptopIcon,
  Stop,
} from '@phosphor-icons/react';
import { HugeIcon } from "@/components/ui/huge-icon";
import { Mic02Icon } from "@hugeicons/core-free-icons";
import { ConversationArea } from '@/pages/agent-chat/components/ConversationArea';
import { ModelPicker } from '@/components/layout/composer/ModelPicker';
import { ContextUsageRing } from '@/components/layout/composer/ContextUsageRing';
import { ProjectAgentInitializing } from './components/ProjectAgentInitializing';
import { ProjectAgentError } from './components/ProjectAgentError';
import { ProjectAgentStopped } from './components/ProjectAgentStopped';
import { ProjectAgentEmpty } from './components/ProjectAgentEmpty';
import { loadProject } from '@/flows/projects/crud/load-project';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { useAgentRuntime } from '@/flows/agents/runtime';
import { useAgentSettings } from '@/flows/agents/agent-store';
import { useChatShortcuts } from '@/flows/ui/use-chat-shortcuts';
import { sendMessage } from '@/flows/ui/send-message';
import { shortcutCopyLastAssistant } from '@/flows/ui/shortcut-copy-last-assistant';
import { shortcutRegenerateLast } from '@/flows/ui/shortcut-regenerate-last';
import { getMessageText } from '@/models/runtime';
import type { Project } from '@/storage/types';
import type { Agent } from '@/types/electron';

export function ProjectChatView() {
  const { projectId } = useParams();
  const [project, setProject] = React.useState<Project | null>(null);
  const [projectAgent, setProjectAgent] = React.useState<Agent | null>(null);
  const [projectResolved, setProjectResolved] = React.useState(false);

  React.useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setProjectResolved(false);
    (async () => {
      const p = await loadProject(projectId);
      if (cancelled) return;
      setProject(p);
      if (!p) {
        setProjectResolved(true);
        return;
      }

      const allAgents = await listAgents();
      if (cancelled) return;
      const coordinator = allAgents.find(
        (a) => a.agentKind === 'project-coordinator' && p.agentIds.includes(a.id)
      ) ?? null;
      setProjectAgent(coordinator);
      setProjectResolved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (!projectId) return <ProjectAgentEmpty />;

  if (!projectResolved) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <span className="text-sm text-destructive">Project not found</span>
      </div>
    );
  }

  if (!projectAgent) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">Loading project agent...</span>
      </div>
    );
  }

  return <ProjectChatContent project={project} projectAgent={projectAgent} />;
}

function ProjectChatContent({ project, projectAgent }: { project: Project; projectAgent: Agent }) {
  const {
    status,
    messages,
    lastError,
    bootStep,
    usage,
    contextUsage,
    availableModels,
    activeModelContextWindow,
    compaction,
    retry,
    loading,
    send,
    stop,
    restart,
  } = useAgentRuntime(projectAgent.id);
  // Read the current model selection so we can gate the send button.
  // Mirrors the guard in AgentChatView: chat is disabled when no model is chosen.
  const agentSettings = useAgentSettings(projectAgent.id);
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="size-5 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70 animate-spin" />
      </div>
    );
  }

  if (status === 'initializing') {
    return (
      <ProjectAgentInitializing
        currentStep={bootStep}
        agentName={projectAgent.name}
        lastError={lastError}
        onRestart={restart}
      />
    );
  }

  if (status === 'error') {
    return <ProjectAgentError lastError={lastError} onRestart={restart} projectId={project.id} />;
  }

  if (status === 'stopped') {
    return <ProjectAgentStopped onStart={restart} />;
  }

  const isLive = status === 'running' || status === 'busy';
  const isBusy = status === 'busy';

  const onSend = () => {
    const result = sendMessage({ text: input, hasModel, isLive, send })
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
        setInput(getMessageText(lastUser));
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    }
  };

  useChatShortcuts({
    onCopyLast: () => {
      void shortcutCopyLastAssistant({ messages });
    },
    onRegenerate: () => {
      void shortcutRegenerateLast({ messages, agentId: projectAgent.id });
    },
    onStop: () => {
      if (status === 'busy' || status === 'running') void stop();
    },
    enabled: !!projectAgent,
  });

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <ConversationArea
        messages={messages}
        busy={isBusy}
        compaction={compaction}
        retry={retry}
        onCancel={stop}
        agentId={projectAgent.id}
        agentName={projectAgent.name}
        onPromptSelect={(prompt) => {
          setInput(prompt)
          requestAnimationFrame(() => textareaRef.current?.focus())
        }}
      />
      <div className="shrink-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-start">
            <div className="flex-1 rounded-3xl bg-sidebar">
            <textarea
              ref={textareaRef}
              placeholder="Message the project agent..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              autoFocus
              className="min-h-[24px] w-full resize-none border-0 bg-transparent px-composer pt-4 pb-2 text-sm text-sidebar-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center justify-between px-composer py-button-y">
              <div className="flex items-center gap-3">
                <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer">
                  <Icon icon={PlusIcon} className="size-5" />
                </button>
                <ContextUsageRing
                  percent={contextPercent}
                  usedTokens={contextUsedTokens}
                  maxTokens={contextWindow}
                />
                <div className="flex items-center gap-1 text-sidebar-foreground/70">
                  <Icon icon={LaptopIcon} className="size-5" />
                  <span className="text-sm">Local</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <ModelPicker agentId={projectAgent.id} />
                <button className="text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer">
                  <HugeIcon icon={Mic02Icon} size={20} className="text-sidebar-foreground/70" />
                </button>
                <button
                  onClick={isBusy ? stop : onSend}
                  disabled={!isBusy && (input.trim().length === 0 || !hasModel)}
                  title={!hasModel ? 'Pick a model first' : undefined}
                  className={
                    'flex size-5 items-center justify-center rounded-full cursor-pointer ' +
                    (isBusy
                      ? 'bg-chat-composer-stop-bg hover:bg-chat-composer-stop-hover'
                      : 'bg-chat-composer-send-bg hover:bg-chat-composer-send-hover disabled:bg-muted disabled:cursor-not-allowed')
                  }
                >
                    <Icon icon={isBusy ? Stop : ArrowUpIcon} className="size-4 text-white" />
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