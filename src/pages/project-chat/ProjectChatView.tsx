import { useParams } from 'react-router-dom';
import * as React from 'react';
import { loadProject } from '@/flows/projects/crud/load-project';
import { loadMessages } from '@/flows/channels/ui/load-messages';
import type { Project } from '@/storage/types';
import type { ChannelMessage } from '@/types/electron';

export function ProjectChatView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = React.useState<Project | null>(null);
  const [_messages, setMessages] = React.useState<ChannelMessage[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);
    loadProject(projectId)
      .then((p) => {
        if (cancelled) return;
        setProject(p ?? null);
        if (p?.channelId) {
          return loadMessages(p.channelId);
        }
        return [];
      })
      .then((msgs) => {
        if (cancelled) return;
        setMessages(msgs ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
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
      <div className="flex-1 overflow-y-auto">
        <span className="text-sm text-muted-foreground">Project: {project.name}</span>
      </div>
    </div>
  );
}
