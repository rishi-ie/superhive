/**
 * All channels across workspaces with search, filter, and sort.
 */
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { StatusFilter, type FilterOption } from '@/components/ui/StatusFilter';
import { NewButton } from '@/components/ui/NewButton';
import { UniversalListCard } from '@/components/ui/UniversalListCard';
import { Select } from '@/components/ui/Select';
import { ChannelStatusPill } from '@/components/channels';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { MessageSquare } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { listChannels, listProjectAgents } from '@/data/projects/store';
import { listWorkspaces } from '@/data/workspaces/store';
import { formatRelativeTime } from '@/lib/relative-time';
import type { ChannelStatus } from '@/data/projects/interface';

type SortKey = 'status' | 'recent' | 'messages';

const STATUS_OPTIONS = [
  { value: 'ALL' as const, label: 'All' },
  { value: 'OPEN' as const, label: 'Open' },
  { value: 'AWAITING_REPLY' as const, label: 'Awaiting' },
  { value: 'RESOLVED' as const, label: 'Resolved' },
] as const;

type UniversalChannelsViewProps = {
  onChannelSelect?: (id: string, workspaceId: string) => void;
  selectedChannelId?: string | null;
  onCreateChannel?: () => void;
};

/**
 * @param onChannelSelect - Called when a channel is selected
 * @param selectedChannelId - Currently selected channel ID
 * @param onCreateChannel - Called when "New Channel" is clicked
 */
export function UniversalChannelsView({ onChannelSelect, selectedChannelId, onCreateChannel }: UniversalChannelsViewProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ChannelStatus>('ALL');
  const [sort, setSort] = useState<SortKey>('recent');

  const channels = listChannels();
  const allAgents = listProjectAgents();
  const workspaces = listWorkspaces();

  const workspaceMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const w of workspaces) m[w.id] = w.name;
    return m;
  }, [workspaces]);

  const agentMap = useMemo(() => {
    const m: Record<string, typeof allAgents[number]> = {};
    for (const a of allAgents) m[a.name] = a;
    return m;
  }, [allAgents]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: channels.length };
    for (const c of channels) {
      counts[c.status] = (counts[c.status] ?? 0) + 1;
    }
    return counts;
  }, [channels]);

  const filterOptions = useMemo<readonly FilterOption<'ALL' | ChannelStatus>[]>(() =>
    STATUS_OPTIONS.map(o => ({
      ...o,
      count: statusCounts[o.value === 'ALL' ? 'ALL' : o.value] ?? 0,
    })),
    [statusCounts]
  );

  const filtered = useMemo(() => {
    let result = channels;
    if (statusFilter !== 'ALL') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(c =>
        c.topic.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q) ||
        c.participants.some(p => p.toLowerCase().includes(q)) ||
        (workspaceMap[c.workspaceId ?? ''] ?? '').toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      if (sort === 'recent') {
        const aTime = a.updatedAt;
        const bTime = b.updatedAt;
        return new Date(`today ${bTime}`).getTime() - new Date(`today ${aTime}`).getTime();
      }
      if (sort === 'messages') {
        return b.messageCount - a.messageCount;
      }
      const order: Record<ChannelStatus, number> = { OPEN: 0, AWAITING_REPLY: 1, RESOLVED: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  }, [channels, query, statusFilter, sort, workspaceMap]);

  if (channels.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare size={32} strokeWidth={STROKE_WIDTH} />}
        title="No channels yet"
        description="Channels are where agents and humans coordinate work"
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 pt-5 pb-3 shrink-0">
        <h1 className="text-base font-bold text-foreground">All Channels</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {channels.length} channel{channels.length !== 1 ? 's' : ''} across {Object.keys(statusCounts).length - 1} workspace{Object.keys(statusCounts).length - 1 !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="px-6 pb-3 flex items-center gap-3 shrink-0">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search channels..."
          className="flex-1"
        />
        <Select
          value={sort}
          options={[
            { value: 'recent', label: 'Sort: Recent' },
            { value: 'status', label: 'Sort: Status' },
            { value: 'messages', label: 'Sort: Messages' },
          ]}
          onChange={v => setSort(v as SortKey)}
          className="w-32"
        />
        <NewButton label="New Channel" onClick={onCreateChannel} />
      </div>

      <div className="px-6 pb-3 shrink-0">
        <StatusFilter
          options={filterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No channels match &ldquo;{query}&rdquo;</p>
            <button
              type="button"
              onClick={() => { setQuery(''); setStatusFilter('ALL'); }}
              className="mt-2 text-xs text-chart-1 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(channel => {
              const p0 = channel.participants[0] ?? '';
              const p1 = channel.participants[1] ?? '';
              const a = agentMap[p0];
              const b = agentMap[p1];
              const initialsA = a?.initials ?? p0.slice(0, 2).toUpperCase() ?? '?';
              const initialsB = b?.initials ?? p1.slice(0, 2).toUpperCase() ?? '?';
              const wsName = workspaceMap[channel.workspaceId ?? ''] ?? channel.workspaceId ?? '';

              return (
                <UniversalListCard
                  key={channel.id}
                  selected={selectedChannelId === channel.id}
                  onClick={() => onChannelSelect?.(channel.id, channel.workspaceId ?? '')}
                  className="flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0 size-7">
                      <Avatar
                        size="xs"
                        fallback={initialsA}
                        className="absolute top-0 left-0 ring-1 ring-card z-10"
                      />
                      <Avatar
                        size="xs"
                        fallback={initialsB}
                        className="absolute bottom-0 right-0 ring-1 ring-card"
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground truncate flex-1">
                      {channel.topic}
                    </span>
                    {channel.unread && (
                      <span className="size-1.5 rounded-full bg-chart-1 shrink-0" />
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(channel.updatedAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate pl-px leading-4">
                    {channel.lastMessagePreview}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {channel.participants.join(' ↔ ')}
                    </span>
                    <span className="text-muted-foreground/40 shrink-0">·</span>
                    <span className="text-[9px] font-fustat text-muted-foreground bg-secondary/80 rounded px-1 py-0.5 shrink-0">
                      {channel.relatedTicketId}
                    </span>
                    <span className="text-muted-foreground/40 shrink-0">·</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {channel.messageCount} msg{channel.messageCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-muted-foreground/40 shrink-0">·</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 truncate">
                      {wsName}
                    </span>
                    <span className="text-muted-foreground/40 shrink-0">·</span>
                    <ChannelStatusPill status={channel.status} />
                  </div>
                </UniversalListCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
