/**
 * Status badge for communication channels (OPEN / AWAITING_REPLY / RESOLVED).
 * Used across CommunicationsView, ChannelDetailView, ChannelOverviewTab, and UniversalChannelsView.
 */

/**
 * @param status - Channel status: OPEN, AWAITING_REPLY, or RESOLVED
 */
export function ChannelStatusPill({ status }: { status: 'OPEN' | 'AWAITING_REPLY' | 'RESOLVED' }) {
  const map: Record<string, { color: string; label: string }> = {
    OPEN:           { color: 'bg-chart-2',     label: 'OPEN' },
    AWAITING_REPLY: { color: 'bg-chart-3',     label: 'AWAITING' },
    RESOLVED:       { color: 'bg-muted-foreground/40', label: 'RESOLVED' },
  };
  const cfg = map[status] ?? { color: 'bg-muted-foreground/40', label: 'UNKNOWN' };
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
      <span className={`size-1 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}
