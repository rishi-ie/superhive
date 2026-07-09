import { useParams } from 'react-router-dom';
import * as React from 'react';
import { ProjectChatHeader } from './components/ProjectChatHeader';
import { ProjectChatConversation } from './components/ProjectChatConversation';
import { ProjectChatInput } from './components/ProjectChatInput';
import { loadProject } from '@/flows/projects/crud/load-project';
import { loadMessages } from '@/flows/channels/ui/load-messages';
import { listAgents } from '@/flows/agents/crud/list-agents';
import type { Project } from '@/storage/types';
import type { ChannelMessage, Agent } from '@/types/electron';

export function ProjectChatView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = React.useState<Project | null>(null);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [projectAgent, setProjectAgent] = React.useState<Agent | null>(null);
  const [channelId, setChannelId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChannelMessage[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const p = await loadProject(projectId);
        if (cancelled) return;
        setProject(p);

        if (!p) {
          setLoading(false);
          return;
        }

        const allAgents = await listAgents();
        if (cancelled) return;
        setAgents(allAgents);
        setProjectAgent(allAgents.find((a) => a.agentKind === 'project-coordinator') ?? null);

        if (p.channelId) {
          setChannelId(p.channelId);
          const msgs = await loadMessages(p.channelId);
          if (cancelled) return;
          setMessages(msgs);
        }
      } catch {
        // ignore — leave state as-is
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
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

  return (
    <div className="flex h-full flex-col bg-background">
      <ProjectChatHeader project={project} members={agents} />
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <ProjectChatConversation
            messages={messages}
            projectAgentName={projectAgent?.name ?? 'Project Agent'}
          />
        </div>
        {channelId && (
          <ProjectChatInput
            channelId={channelId}
            senderId="user"
            onMessageSent={(msg) =>
              setMessages((prev) => [...prev, msg as ChannelMessage])
            }
          />
        )}
      </div>
    </div>
  );
}