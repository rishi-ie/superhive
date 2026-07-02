/**
 * Project Agent chat view — persistent thread per project.
 */
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/lib/toast-context';
import { listThreadsByScope, getThreadByProject, createThreadForProject, addMessageToActiveThread } from '@/data/chat/store';
import { getProject } from '@/data/projects/store';
import { ChatHeader } from './ChatHeader';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatThreadList } from './ChatThreadList';
import type { ChatThread as ChatThreadType } from '@/data/chat/store';

type ProjectAgentViewProps = {
  projectId: string;
  workspaceId: string;
  onSend?: (message: string) => void;
};

/**
 * Project-scoped chat — one persistent thread per project.
 * @param projectId - Project ID this agent serves
 * @param workspaceId - Workspace ID for context
 * @param onSend - Called when a message is sent
 */
export function ProjectAgentView({ projectId, onSend }: ProjectAgentViewProps) {
  const toast = useToast();
  const project = projectId ? getProject(projectId) : undefined;
  const allThreads = projectId
    ? listThreadsByScope({ projectId, kind: 'project-agent' })
    : [];
  const projectThread = projectId ? getThreadByProject(projectId) : undefined;

  const [activeThread, setActiveThread] = useState<ChatThreadType | null>(projectThread ?? allThreads[0] ?? null);

  useEffect(() => {
    if (!activeThread) {
      setActiveThread(projectThread ?? allThreads[0] ?? null);
    }
  }, [activeThread, projectThread, allThreads]);

  const ensureThread = useCallback((): ChatThreadType | null => {
    if (activeThread) return activeThread;
    const title = `Project Agent · ${project?.title ?? 'Project'}`;
    const t = createThreadForProject(projectId, title);
    setActiveThread(t);
    return t;
  }, [activeThread, project, projectId]);

  const handleSubmit = useCallback((text: string, _model: string) => {
    if (!projectId) return;
    const thread = ensureThread();
    if (!thread) {
      toast({ title: 'Could not create thread', type: 'error' });
      return;
    }
    addMessageToActiveThread(text, thread.agentId);
    onSend?.(text);
    toast({ title: 'Sent to project agent', type: 'info' });
  }, [projectId, ensureThread, onSend, toast]);

  const handleSuggestion = useCallback((text: string) => {
    handleSubmit(text, '');
  }, [handleSubmit]);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Open a project to chat with its Project Agent.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader agent={null} />
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_220px] border-t border-border/40">
        <div className="flex flex-col min-h-0">
          {activeThread && activeThread.messages.length > 0 ? (
            <ChatThread thread={activeThread} />
          ) : (
            <ChatEmptyState onSuggestionClick={handleSuggestion} />
          )}
          <ChatInput
            agentId={`proj-${projectId}`}
            onSubmit={handleSubmit}
            placeholder={`Message the Project Agent for ${project?.title ?? 'this project'}…`}
          />
        </div>
        <ChatThreadList
          threads={allThreads}
          activeThreadId={activeThread?.id ?? undefined}
          onThreadSelect={setActiveThread}
          onNewThread={() => {
            const t = createThreadForProject(projectId, `Project Agent · ${new Date().toLocaleString()}`);
            setActiveThread(t);
          }}
        />
      </div>
    </div>
  );
}
