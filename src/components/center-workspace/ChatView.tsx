import { useState, useCallback } from 'react';
import { getAgent, getTelemetry } from '@/data/agents/store';
import { getCurrentThread, listThreads, addMessageToActiveThread, createThreadForAgent } from '@/data/chat/store';
import type { ChatThread as ChatThreadType } from '@/data/chat/store';
import { ChatHeader } from './ChatHeader';
import { ChatThreadList } from './ChatThreadList';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { ChatEmptyState } from './ChatEmptyState';

type ChatViewProps = {
  workspaceId: string;
  agentId?: string | null;
  onSend?: (message: string) => void;
  onAction?: (actionId: string) => void;
};

export function ChatView({ workspaceId, agentId, onSend, onAction }: ChatViewProps) {
  const agent = agentId ? getAgent(agentId) ?? null : null;
  const allThreads = listThreads();

  const agentThread = agentId
    ? allThreads.find(t => t.agentId === agentId) ?? null
    : allThreads[0] ?? null;

  const [activeThread, setActiveThread] = useState<ChatThreadType | null>(agentThread);
  const threads = agentId
    ? allThreads.filter(t => t.agentId === agentId)
    : allThreads;

  const agentInitials = agent?.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '??';

  const handleThreadSelect = useCallback((thread: ChatThreadType) => {
    setActiveThread(thread);
  }, []);

  const handleNewThread = useCallback(() => {
    if (!agentId) return;
    const title = `Chat with ${agent?.name ?? 'Agent'}`;
    const thread = createThreadForAgent(agentId, title);
    setActiveThread(thread);
  }, [agentId, agent]);

  const handleSubmit = useCallback(
    (text: string, _model: string) => {
      if (!activeThread) {
        if (!agentId) return;
        const thread = createThreadForAgent(agentId, `Chat with ${agent?.name ?? 'Agent'}`);
        setActiveThread(thread);
        addMessageToActiveThread(text, agentId);
        onSend?.(text);
      } else {
        addMessageToActiveThread(text, activeThread.agentId);
        onSend?.(text);
      }
    },
    [activeThread, agentId, agent, onSend],
  );

  const handleSuggestion = useCallback(
    (text: string) => {
      if (!activeThread && agentId) {
        const thread = createThreadForAgent(agentId, `Chat with ${agent?.name ?? 'Agent'}`);
        setActiveThread(thread);
        addMessageToActiveThread(text, agentId);
        onSend?.(text);
      } else if (activeThread) {
        addMessageToActiveThread(text, activeThread.agentId);
        onSend?.(text);
      }
    },
    [activeThread, agentId, agent, onSend],
  );

  const handleRegenerate = useCallback(
    (messageId: string) => {
      if (!activeThread) return;
      const idx = activeThread.messages.findIndex(m => m.id === messageId);
      if (idx <= 1) return;
      const userMsg = activeThread.messages[idx - 1];
      if (userMsg?.role === 'user') {
        addMessageToActiveThread(userMsg.content, activeThread.agentId);
        onSend?.(userMsg.content);
      }
    },
    [activeThread, onSend],
  );

  const tokenCount = activeThread?.messages.reduce((sum, m) => sum + (m.tokenCount ?? 0), 0) ?? 0;
  const sessionCost = activeThread?.messages.reduce((sum, m) => {
    if (m.role !== 'assistant') return sum;
    return sum + ((m.tokenCount ?? 0) * 0.00001);
  }, 0) ?? 0;

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <ChatHeader
        agent={agent ?? null}
        tokenCount={tokenCount > 0 ? tokenCount : undefined}
        sessionCost={sessionCost > 0 ? sessionCost : undefined}
      />

      {threads.length > 0 && (
        <ChatThreadList
          threads={threads}
          activeThreadId={activeThread?.id}
          onThreadSelect={handleThreadSelect}
          onNewThread={agentId ? handleNewThread : undefined}
        />
      )}

      {activeThread ? (
        <ChatThread
          thread={activeThread}
          agentName={agent?.name}
          agentInitials={agentInitials}
          onRegenerate={handleRegenerate}
          empty={
            <ChatEmptyState agentName={agent?.name ?? undefined} onSuggestionClick={handleSuggestion} />
          }
        />
      ) : (
        <ChatEmptyState agentName={agent?.name ?? undefined} onSuggestionClick={handleSuggestion} />
      )}

      <ChatInput
        agentId={agentId ?? undefined}
        onSubmit={handleSubmit}
        placeholder={agent ? `Message ${agent.name}…` : 'Describe an objective…'}
      />
    </div>
  );
}
