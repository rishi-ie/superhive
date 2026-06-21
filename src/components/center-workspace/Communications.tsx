import { Avatar } from '@/components/ui/Avatar';
import type { CommunicationChannel, ProjectAgent } from '@/data/mock/project';

type CommunicationsProps = {
  channels: CommunicationChannel[];
  agents: ProjectAgent[];
};

function ChannelStatusPill({ status }: { status: CommunicationChannel['status'] }) {
  const map = {
    OPEN:           { color: 'bg-chart-2',     label: 'OPEN' },
    AWAITING_REPLY: { color: 'bg-chart-3',     label: 'AWAITING' },
    RESOLVED:       { color: 'bg-muted-foreground/40', label: 'RESOLVED' },
  };
  const cfg = map[status];
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
      <span className={`size-1 rounded-full ${cfg.color}`} />
      {cfg.label}
    </span>
  );
}

export function Communications({ channels, agents }: CommunicationsProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        Communications
      </span>
      <div className="flex flex-col gap-1.5">
        {channels.map(ch => {
          const a = agents.find(x => x.name === ch.participants[0]);
          const b = agents.find(x => x.name === ch.participants[1]);

          return (
            <div
              key={ch.id}
              className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:bg-card/80 transition-colors"
            >
              <div className="relative shrink-0 size-7">
                <Avatar
                  size="xs"
                  fallback={a?.initials ?? '?'}
                  className="absolute top-0 left-0 ring-1 ring-card z-10"
                />
                <Avatar
                  size="xs"
                  fallback={b?.initials ?? '?'}
                  className="absolute bottom-0 right-0 ring-1 ring-card"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">{ch.topic}</span>
                  {ch.unread && <span className="size-1.5 rounded-full bg-chart-1 shrink-0" />}
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{ch.lastMessagePreview}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-muted-foreground/70 truncate">
                    {ch.participants.join(' ↔ ')}
                  </span>
                  <span className="text-muted-foreground/40 shrink-0">·</span>
                  <span className="text-[9px] font-fustat text-muted-foreground bg-secondary/80 rounded px-1 py-0.5 shrink-0">
                    {ch.relatedTicketId}
                  </span>
                  <span className="text-muted-foreground/40 shrink-0">·</span>
                  <span className="text-[9px] text-muted-foreground/70 shrink-0">{ch.messageCount} msgs</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-[9px] text-muted-foreground/70">{ch.updatedAt}</span>
                <ChannelStatusPill status={ch.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}