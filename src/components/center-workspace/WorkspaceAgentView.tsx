/**
 * Workspace Agent chat view — persistent thread per workspace.
 * Used for cross-project questions, planning, and standups.
 */
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/lib/toast-context';
import { listThreadsByScope, getThreadByWorkspace, createThreadForWorkspace, addMessageToActiveThread } from '@/data/chat/store';
import { getCurrentWorkspace, listWorkspaces } from '@/data/workspaces/store';
import { ChatHeader } from './ChatHeader';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatThreadList } from './ChatThreadList';
import type { ChatThread as ChatThreadType } from '@/data/chat/store';

type WorkspaceAgentViewProps = {
  workspaceId: string;
  onSend?: (message: string) => void;
};

/**
 * Workspace-scoped chat — one persistent thread per workspace.
 * @param workspaceId - Workspace ID this agent serves
 * @param onSend - Called when a message is sent
 */
export function WorkspaceAgentView({ workspaceId, onSend }: WorkspaceAgentViewProps) {
  const toast = useToast();
  const workspace = getCurrentWorkspace() ?? listWorkspaces().find(w => w.id === workspaceId);
  const allThreads = listThreadsByScope({ workspaceId, kind: 'workspace-agent' });
  const workspaceThread = getThreadByWorkspace(workspaceId);

  const [activeThread, setActiveThread] = useState<ChatThreadType | null>(workspaceThread ?? allThreads[0] ?? null);

  useEffect(() => {
    if (!activeThread) {
      setActiveThread(workspaceThread ?? allThreads[0] ?? null);
    }
  }, [activeThread, workspaceThread, allThreads]);

  const ensureThread = useCallback((): ChatThreadType | null => {
    if (activeThread) return activeThread;
    const title = `Workspace Agent · ${workspace?.name ?? 'Workspace'}`;
    const t = createThreadForWorkspace(workspaceId, title);
    setActiveThread(t);
    return t;
  }, [activeThread, workspace, workspaceId]);

  const handleSubmit = useCallback((text: string, _model: string) => {
    if (!workspaceId) return;
    const thread = ensureThread();
    if (!thread) {
      toast({ title: 'Could not create thread', type: 'error' });
      return;
    }
    addMessageToActiveThread(text, thread.agentId);
    onSend?.(text);
    toast({ title: 'Sent to workspace agent', type: 'info' });
  }, [workspaceId, ensureThread, onSend, toast]);

  const handleSuggestion = useCallback((text: string) => {
    handleSubmit(text, '');
  }, [handleSubmit]);

  if (!workspaceId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Select a workspace to chat with its Workspace Agent.
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
            agentId={`ws-${workspaceId}`}
            onSubmit={handleSubmit}
            placeholder={`Message the Workspace Agent for ${workspace?.name ?? 'this workspace'}…`}
          />
        </div>
        <ChatThreadList
          threads={allThreads}
          activeThreadId={activeThread?.id ?? undefined}
          onThreadSelect={setActiveThread}
          onNewThread={() => {
            const t = createThreadForWorkspace(workspaceId, `Workspace Agent · ${new Date().toLocaleString()}`);
            setActiveThread(t);
          }}
        />
      </div>
    </div>
  );
}
