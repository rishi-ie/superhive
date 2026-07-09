/**
 * ProjectChatView — project-coordinator chat surface.
 *
 * Architecture mirrors AgentChatView (split into outer loader + inner runtime)
 * so we can call `useAgentRuntime` only after we've identified the
 * project-agent. Project-agent runtimes are intentionally isolated from
 * standard-agent runtimes via the forked components in this folder; the
 * underlying `useAgentRuntime` hook is shared (agent-store is generic).
 */

import { useParams } from 'react-router-dom';
import * as React from 'react';
import { ProjectChatHeader } from './components/ProjectChatHeader';
import { ProjectChatConversation } from './components/ProjectChatConversation';
import { ProjectChatInput } from './components/ProjectChatInput';
import { ProjectAgentInitializing } from './components/ProjectAgentInitializing';
import { ProjectAgentError } from './components/ProjectAgentError';
import { ProjectAgentStopped } from './components/ProjectAgentStopped';
import { ProjectAgentEmpty } from './components/ProjectAgentEmpty';
import { loadProject } from '@/flows/projects/crud/load-project';
import { listAgents } from '@/flows/agents/crud/list-agents';
import { useAgentRuntime } from '@/flows/agents/runtime/use-agent-runtime';
import type { Project } from '@/storage/types';
import type { Agent } from '@/types/electron';

export function ProjectChatView() {
  const { projectId } = useParams<{ projectId: string }>();
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
      const coordinator = allAgents.find((a) => a.agentKind === 'project-coordinator') ?? null;
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
  const { status, messages, lastError, bootStep, loading, send, restart } = useAgentRuntime(projectAgent.id);
  const [input, setInput] = React.useState('');

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

  const onSend = () => {
    const t = input.trim();
    if (!t || !isLive) return;
    send(t);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <ProjectChatHeader project={project} members={[projectAgent]} />
      <div className="flex-1 min-h-0">
        <ProjectChatConversation
          messages={messages}
          projectAgentName={projectAgent.name}
        />
      </div>
      <ProjectChatInput onSend={onSend} disabled={!isLive} />
    </div>
  );
}