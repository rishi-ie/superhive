/**
 * Channel statistics — total, open, awaiting, resolved counts and most active list.
 */
import type { CommunicationChannel } from '@/data/projects/store';
import { StatCard } from '@/components/ui/StatCard';
import { SectionLabel } from '@/components/ui/SectionLabel';

type ChannelStatsProps = {
  channels: CommunicationChannel[];
  onChannelClick?: (id: string, workspaceId: string) => void;
};

/**
 * Channel statistics — total, open, awaiting, resolved counts and most active list.
 * @param channels - Channels to aggregate
 * @param onChannelClick - Called when channel is clicked
 */
export function ChannelStats({ channels, onChannelClick }: ChannelStatsProps) {
  const open = channels.filter(c => c.status === 'OPEN').length;
  const awaiting = channels.filter(c => c.status === 'AWAITING_REPLY').length;
  const resolved = channels.filter(c => c.status === 'RESOLVED').length;
  const unread = channels.filter(c => c.unread).length;
  const mostActive = [...channels]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  return (
    <div className="p-3 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Total" value={channels.length} />
        <StatCard label="Open" value={open} color="text-chart-2" />
        <StatCard label="Awaiting" value={awaiting} color="text-chart-3" />
        <StatCard label="Resolved" value={resolved} />
      </div>

      {unread > 0 && (
        <div className="text-[10px] text-chart-1 bg-chart-1/10 rounded px-2 py-1.5">
          {unread} channel{unread !== 1 ? 's' : ''} with unread messages
        </div>
      )}

      {mostActive.length > 0 && (
        <div className="border-t border-border/40 pt-3 space-y-2">
          <SectionLabel>Most Active</SectionLabel>
          <div className="space-y-1">
            {mostActive.map(ch => (
              <button
                key={ch.id}
                onClick={() => onChannelClick?.(ch.id, ch.workspaceId ?? '')}
                className="w-full text-left p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors"
                type="button"
              >
                <div className="text-[10px] font-medium text-foreground truncate">{ch.topic}</div>
                <div className="text-[9px] text-muted-foreground">{ch.messageCount} msgs · {ch.updatedAt}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
