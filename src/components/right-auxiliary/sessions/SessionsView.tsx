/**
 * Sessions view — search, filter, and list past chat threads.
 */
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterChips } from '@/components/right-auxiliary/shared/FilterChips';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { ThreadRow } from './ThreadRow';
import { listThreads } from '@/data/chat/store';

type FilterId = 'all' | 'today' | 'week' | 'older';

type SessionsViewProps = {
  onThreadSelect?: (threadId: string) => void;
};

/**
 * Sessions view — search, filter, and list past chat threads.
 * @param onThreadSelect - Called when thread row is clicked
 */
export function SessionsView({ onThreadSelect }: SessionsViewProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');

  const allThreads = listThreads();
  const now = Date.now();

  const filtered = allThreads.filter(thread => {
    // Filter by time bucket
    const ageMs = now - new Date(thread.updatedAt).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const ageDays = ageHours / 24;

    if (filter === 'today' && ageHours >= 24) return false;
    if (filter === 'week' && ageDays >= 7) return false;
    if (filter === 'older' && ageDays < 7) return false;

    // Search: title or any message content
    if (query.trim()) {
      const q = query.toLowerCase();
      const inTitle = thread.title.toLowerCase().includes(q);
      const inMessages = thread.messages.some(m =>
        m.content.toLowerCase().includes(q)
      );
      if (!inTitle && !inMessages) return false;
    }

    return true;
  });

  const countFor = (id: FilterId): number => {
    return allThreads.filter(thread => {
      const ageMs = now - new Date(thread.updatedAt).getTime();
      const ageHours = ageMs / (1000 * 60 * 60);
      const ageDays = ageHours / 24;
      if (id === 'today' && ageHours >= 24) return false;
      if (id === 'week' && ageDays >= 7) return false;
      if (id === 'older' && ageDays < 7) return false;
      return true;
    }).length;
  };

  const filterChips = [
    { id: 'all'   as FilterId, label: `All (${allThreads.length})`       },
    { id: 'today' as FilterId, label: `Today (${countFor('today')})`      },
    { id: 'week'  as FilterId, label: `This Week (${countFor('week')})`  },
    { id: 'older' as FilterId, label: `Older (${countFor('older')})`     },
  ];

  const hasActiveSearchOrFilter = query.trim() !== '' || filter !== 'all';
  const isEmpty = filtered.length === 0;
  const isNoResults = isEmpty && hasActiveSearchOrFilter;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky search + filters */}
      <div className="px-3 py-2 space-y-2 shrink-0 border-b border-border/40">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search sessions..."
          size="sm"
        />
        <FilterChips
          chips={filterChips}
          selected={filter}
          onChange={id => setFilter(id as FilterId)}
        />
      </div>

      {/* Session count label */}
      <div className="px-3 pt-2 pb-1 shrink-0">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {hasActiveSearchOrFilter
            ? `${filtered.length} of ${allThreads.length} sessions`
            : `${allThreads.length} session${allThreads.length !== 1 ? 's' : ''}`
          }
        </span>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isEmpty ? (
          isNoResults ? (
            <EmptyState
              icon={<MessageSquare size={28} strokeWidth={1.5} />}
              title="No matches"
              description="Try a different search or filter"
            />
          ) : (
            <EmptyState
              icon={<MessageSquare size={28} strokeWidth={1.5} />}
              title="No sessions yet"
              description="Start a conversation with an agent"
            />
          )
        ) : (
          <div className="space-y-1.5">
            {filtered.map(thread => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                onClick={() => onThreadSelect?.(thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
