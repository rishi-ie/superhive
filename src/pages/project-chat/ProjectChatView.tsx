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
import { ConversationArea } from '@/pages/agent-chat/components/ConversationArea';
import { ProjectChatComposer } from './components/ProjectChatComposer';
import { ProjectAgentEmpty } from './components/ProjectAgentEmpty';
import { ProjectPlanApproval } from './components/ProjectPlanApproval';
import { loadProject } from '@/flows/projects/crud/load-project';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { useAgentRuntime } from '@/flows/agents/runtime';
import { useAgentSettings } from '@/flows/agents/settings';
import { useAgentsListVersion } from '@/flows/agents/runtime';
import { useChatShortcuts } from '@/flows/ui/use-chat-shortcuts';
import { shortcutCopyLastAssistant } from '@/flows/ui/shortcut-copy-last-assistant';
import {
  useProjectConversation,
  useProjectExecution,
} from '@/flows/orchestration';
import type { Project } from '@/storage/types';
import type { Agent } from '@/types/electron';

export function ProjectChatView() {
  const { projectId } = useParams();
  const [project, setProject] = React.useState<Project | null>(null);
  const [projectAgent, setProjectAgent] = React.useState<Agent | null>(null);
  const [projectResolved, setProjectResolved] = React.useState(false);
  // Re-resolve the project coordinator when the agents table changes (e.g.
  // the coordinator's folder was deleted and the watcher evicted the row).
  const agentsVersion = useAgentsListVersion();
  // Track the projectId that the current state was resolved against so we
  // only tear down the chat UI when the user actually navigates to a
  // different project. agentsVersion bumps re-resolve in place — without
  // this guard, every fs reconcile would unmount/remount ProjectChatContent
  // and reset useAgentRuntime's internal state, causing visible flicker.
  const prevProjectIdRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (!projectId) {
      setProject(null);
      setProjectAgent(null);
      setProjectResolved(false);
      prevProjectIdRef.current = undefined;
      return;
    }
    let cancelled = false;
    if (prevProjectIdRef.current !== projectId) {
      setProjectResolved(false);
      setProject(null);
      setProjectAgent(null);
      prevProjectIdRef.current = projectId;
    }
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
  }, [projectId, agentsVersion]);

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
  const execution = useProjectExecution(project.id);
  const projectConversation = useProjectConversation(project.id);
  const {
    status,
    messages,
    inFlight,
    contextUsage,
    availableModels,
    activeModelContextWindow,
    compaction,
    retry,
    pendingTurn,
    agentResponseActive,
    readiness,
    configurationError,
    loading,
    send,
    stop,
  } = useAgentRuntime(projectAgent.id);
  // Read the current model selection so we can gate the send button.
  // Mirrors the guard in AgentChatView: chat is disabled when no model is chosen.
  const agentSettings = useAgentSettings(projectAgent.id);
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

  useChatShortcuts({
    onCopyLast: () => {
      void shortcutCopyLastAssistant({ messages });
    },
    onStop: () => {
      if (status === 'busy' || status === 'active') void stop();
    },
    enabled: !!projectAgent,
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="size-5 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70 animate-spin" />
      </div>
    );
  }

  // The main process guarantees readiness before every send/wake.
  const isLive = true;
  const isBusy = status === 'busy';

  return (
    <div className="flex flex-1 min-h-0 flex-col [--font-scale:1.025] [--foreground:#D8D8D8] [--muted-foreground:#5B5B5B]">
      {readiness === 'configuration_error' && (
        <div role="alert" className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-foreground">
          <span className="truncate">{configurationError?.message ?? 'Project Agent model or provider configuration needs attention.'}</span>
          <button
            type="button"
            className="shrink-0 font-medium underline underline-offset-2"
            onClick={() => window.dispatchEvent(new Event('superhive:open-manage'))}
          >
            Open Manage
          </button>
        </div>
      )}
      <ConversationArea
        messages={messages}
        inFlight={inFlight}
        busy={isBusy}
        compaction={compaction}
        retry={retry}
        onCancel={stop}
        agentId={projectAgent.id}
        pendingTurn={pendingTurn}
        agentResponseActive={agentResponseActive}
        projectChannelMessages={projectConversation.messages}
      />
      <ProjectPlanApproval
        snapshot={execution.snapshot}
        plans={execution.plans}
        onApprove={execution.approvePlan}
      />
      <div className="shrink-0"><ProjectChatComposer agentId={projectAgent.id} isBusy={isBusy} isLive={isLive} contextPercent={contextPercent} contextUsedTokens={contextUsedTokens} contextWindow={contextWindow} onSend={(input) => void send(input)} onStop={() => void stop()} /></div>
    </div>
  );
}
