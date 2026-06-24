import { useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { ChatThread } from '@/data/chat/store';

type ChatThreadListProps = {
  threads: ChatThread[];
  activeThreadId?: string;
  onThreadSelect?: (thread: ChatThread) => void;
  onNewThread?: () => void;
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1d';
  return `${diffDays}d`;
}

export function ChatThreadList({ threads, activeThreadId, onThreadSelect, onNewThread }: ChatThreadListProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="shrink-0 border-b border-border/40">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-4 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <ChevronDown
          size={11}
          strokeWidth={STROKE_WIDTH}
          className={`shrink-0 transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
        <span className="font-medium">
          {threads.length} thread{threads.length !== 1 ? 's' : ''}
        </span>
        {activeThreadId && (
          <span className="ml-1 text-muted-foreground/50">
            · {threads.find(t => t.id === activeThreadId)?.title ?? ''}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-2 pb-2 space-y-0.5 max-h-48 overflow-y-auto">
          {threads.map(thread => (
            <button
              key={thread.id}
              type="button"
              onClick={() => onThreadSelect?.(thread)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                thread.id === activeThreadId
                  ? 'bg-sidebar-accent/70 border border-chart-1/30'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-foreground truncate leading-tight">
                  {thread.title}
                </div>
                <div className="text-[9px] text-muted-foreground/50 font-fustat">
                  {thread.messages.length} msgs · {formatRelativeTime(thread.updatedAt)} ago
                </div>
              </div>
            </button>
          ))}
          {onNewThread && (
            <button
              type="button"
              onClick={onNewThread}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            >
              <Plus size={11} strokeWidth={STROKE_WIDTH} className="shrink-0" />
              <span>New thread</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
