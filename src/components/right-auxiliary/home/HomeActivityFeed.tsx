/**
 * HomeActivityFeed — compact live activity stream with flowing feed animation.
 * Auto-refreshes: new rows slide in from top, newest row glows, flow bar fires.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Pause, Play } from 'lucide-react';
import { FilterChips } from '@/components/right-auxiliary/shared/FilterChips';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { listActivity, simulateNewEvent } from '@/data/activity/store';
import type { ActivityEvent } from '@/data/activity/store';
import type { ActivityFilter } from '@/data/activity/interface';
import { HomeActivityRow } from './HomeActivityRow';
import { STROKE_WIDTH } from '@/lib/constants';

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

const AUTO_REFRESH_MS = 12_000;
const MAX_AUTO_EVENTS = 3;

function countRecent(events: ActivityEvent[]): number {
  const cutoff = Date.now() - 10 * 60 * 1000;
  return events.filter(e => new Date(e.timestamp).getTime() > cutoff).length;
}

/**
 * Compact live activity feed with flowing entrance animation.
 * @param workspaceId - Workspace to show activity for
 * @param onAgentClick - Navigate to agent
 * @param onTicketClick - Navigate to ticket
 * @param onChannelClick - Navigate to channel
 */
export function HomeActivityFeed({
  workspaceId,
  onAgentClick,
  onTicketClick,
  onChannelClick,
}: HomeActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [paused, setPaused] = useState(false);
  const [autoEvents, setAutoEvents] = useState<ActivityEvent[]>([]);
  const [flowBar, setFlowBar] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const baseEvents = useMemo(
    () => listActivity({ workspaceId, filter }),
    [workspaceId, filter],
  );
  const recentCount = useMemo(() => countRecent(baseEvents), [baseEvents]);
  const combined = useMemo(
    () => [...autoEvents, ...baseEvents],
    [autoEvents, baseEvents],
  );

  // Auto-refresh: every 12s, prepend a simulated event
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const ev = simulateNewEvent(workspaceId);
      setAutoEvents(prev => [ev, ...prev].slice(0, MAX_AUTO_EVENTS));
      // Fire the flow bar animation
      setFlowBar(true);
      setTimeout(() => setFlowBar(false), 950);
      // Scroll to top to show the new arrival
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [workspaceId, paused]);

  const handleFilter = useCallback((id: string) => setFilter(id as ActivityFilter), []);

  const hasEvents = combined.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-2 pt-2 pb-1.5 shrink-0 space-y-1.5">
        {/* Live indicator row */}
        <div className="flex items-center gap-2">
          {/* LIVE dot — continuous pulse */}
          <span className="relative flex items-center justify-center size-4 shrink-0">
            <span className="absolute inset-0 rounded-full bg-chart-2 opacity-40 live-pulse" />
            <span className="relative size-1.5 rounded-full bg-chart-2" />
          </span>
          <span className="text-[10px] font-semibold text-chart-2 tracking-widest uppercase">Live</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {recentCount > 0 ? `${recentCount} · 10min` : '—'}
          </span>

          {/* Pause / Resume */}
          <button
            onClick={() => setPaused(p => !p)}
            title={paused ? 'Resume' : 'Pause'}
            className="ml-auto shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {paused
              ? <Play size={9} strokeWidth={STROKE_WIDTH} />
              : <Pause size={9} strokeWidth={STROKE_WIDTH} />}
            <span>{paused ? 'resume' : 'pause'}</span>
          </button>
        </div>

        {/* Flow bar — fires on each new event arrival */}
        <div className="relative h-px overflow-hidden">
          <div
            className={`absolute inset-0 bg-chart-2 ${flowBar ? 'flow-bar-active' : 'opacity-0'}`}
          />
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
            {combined.map((event, idx) => {
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
