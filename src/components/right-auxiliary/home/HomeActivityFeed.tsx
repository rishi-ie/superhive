/**
 * HomeActivityFeed — compact live activity stream from the DB.
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import { FilterChips } from '@/components/right-auxiliary/shared/FilterChips';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { listActivity } from '@/data/activity/store';
import type { ActivityEvent } from '@/data/activity/store';
import type { ActivityFilter } from '@/data/activity/interface';
import { HomeActivityRow } from './HomeActivityRow';

type HomeActivityFeedProps = {
  workspaceId: string;
  onAgentClick?: (id: string) => void;
  onTicketClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
};

const FILTER_CHIPS = [
  { id: 'all'      as ActivityFilter, label: 'All' },
  { id: 'agents'  as ActivityFilter, label: 'Agents' },
  { id: 'tickets' as ActivityFilter, label: 'Tickets' },
  { id: 'audits'  as ActivityFilter, label: 'Audits' },
  { id: 'channels'as ActivityFilter, label: 'Chans' },
];

function countRecent(events: ActivityEvent[]): number {
  const cutoff = Date.now() - 10 * 60 * 1000;
  return events.filter(e => new Date(e.timestamp).getTime() > cutoff).length;
}

/**
 * Compact live activity feed from the DB.
 */
export function HomeActivityFeed({
  workspaceId,
  onAgentClick,
  onTicketClick,
  onChannelClick,
}: HomeActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const listRef = useRef<HTMLDivElement>(null);

  const events = useMemo(
    () => listActivity({ workspaceId, filter }),
    [workspaceId, filter],
  );

  const recentCount = useMemo(() => countRecent(events), [events]);

  const handleFilter = useCallback((id: string) => setFilter(id as ActivityFilter), []);

  const hasEvents = events.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-2 pt-2 pb-1.5 shrink-0 space-y-1.5">
        {/* Live indicator row */}
        <div className="flex items-center gap-2">
          <span className="relative flex items-center justify-center size-4 shrink-0">
            <span className="absolute inset-0 rounded-full bg-chart-2 opacity-40 live-pulse" />
            <span className="relative size-1.5 rounded-full bg-chart-2" />
          </span>
          <span className="text-[10px] font-semibold text-chart-2 tracking-widest uppercase">Live</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {recentCount > 0 ? `${recentCount} · 10min` : '—'}
          </span>
        </div>

        {/* Filter strip */}
        <FilterChips
          chips={FILTER_CHIPS}
          selected={filter}
          onChange={handleFilter}
        />
      </div>

      {/* Feed list */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {!hasEvents ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={<span className="size-1.5 rounded-full bg-chart-2 live-pulse" />}
              title="No activity"
              description="Agent actions, ticket updates, and more will appear here"
            />
          </div>
        ) : (
          <div className="space-y-px">
            {events.map((event, idx) => {
              const isNewest = idx === 0;
              return (
                <div
                  key={`${event.id}-${idx}`}
                  className={isNewest ? 'row-arrive row-glow' : undefined}
                >
                  <HomeActivityRow
                    event={event}
                    onAgentClick={onAgentClick}
                    onTicketClick={onTicketClick}
                    onChannelClick={onChannelClick}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
