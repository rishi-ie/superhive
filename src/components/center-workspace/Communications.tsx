/**
 * Project communications grid showing channels and participants.
 */
import { Avatar } from '@/components/ui/Avatar';
import { ChannelStatusPill } from '@/components/channels';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { formatRelativeTime } from '@/lib/relative-time';
import type { CommunicationChannel, ProjectAgent } from '@/data/projects/store';

type CommunicationsProps = {
  channels: CommunicationChannel[];
  agents: ProjectAgent[];
  onChannelClick?: (id: string, workspaceId: string) => void;
  onParticipantClick?: (name: string) => void;
  onTicketClick?: (id: string) => void;
};

function getStatusAccent(status: string): string {
  if (status === 'OPEN') return 'border-l-chart-2';
  if (status === 'PENDING') return 'border-l-chart-3';
  return 'border-l-muted-foreground/30';
}

/**
 * @param channels - Channels to display
 * @param agents - Available agents for participant resolution
 * @param onChannelClick - Called when a channel is clicked
 * @param onParticipantClick - Called when a participant name is clicked
 * @param onTicketClick - Called when a related ticket is clicked
 */
export function Communications({ channels, agents, onChannelClick, onParticipantClick, onTicketClick }: CommunicationsProps) {
  return (
    <div className="flex flex-col gap-2">
      <SectionLabel>Communications</SectionLabel>
      <div className="flex flex-col gap-1.5">
        {channels.map(ch => {
          const a = agents.find(x => x.name === ch.participants[0]);
          const b = agents.find(x => x.name === ch.participants[1]);
          const accent = getStatusAccent(ch.status);

          const lastMsg = ch.lastMessagePreview;
          const speakerPrefix = lastMsg ? `${lastMsg.split(':')[0]}:` : '';

          const handleChannelKey = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChannelClick?.(ch.id, ch.workspaceId ?? '');
            }
          };

          return (
            <div
              key={ch.id}
              className={`flex flex-col p-2.5 rounded-md border border-border bg-card border-l-2 ${accent} hover:bg-card/80 transition-colors`}
            >
              {/* Top row: avatars + title + status + time — clickable channel area */}
              <div className="flex items-start gap-2">
                {/* Avatar stack (visual only) */}
                <div className="flex items-center shrink-0 mt-0.5">
                  <Avatar
                    size="xs"
                    fallback={a?.initials ?? '?'}
                    name={ch.participants[0]}
                    className="ring-1 ring-card"
                  />
                  <Avatar
                    size="xs"
                    fallback={b?.initials ?? '?'}
                    name={ch.participants[1]}
                    className="ring-1 ring-card -ml-2"
                  />
                </div>

                {/* Main click area: title + preview */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onChannelClick?.(ch.id, ch.workspaceId ?? '')}
                  onKeyDown={handleChannelKey}
                  className="flex-1 min-w-0 flex flex-col gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">{ch.topic}</span>
                    {ch.unread && (
                      <span className="size-1.5 rounded-full bg-chart-1 shrink-0" />
                    )}
                  </div>
                  {lastMsg && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {speakerPrefix} {lastMsg.slice(speakerPrefix.length).trim()}
                    </span>
                  )}
                </div>

                {/* Right side: status + time */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <ChannelStatusPill status={ch.status} />
                  <span className="text-[9px] text-muted-foreground/70 font-fustat">
                    {formatRelativeTime(ch.updatedAt)}
                  </span>
                </div>
              </div>

              {/* Bottom row: participant chips + ticket chip + msg count */}
              <div className="flex items-center gap-1.5 border-t border-border/40 pt-1.5 mt-1 flex-wrap">
                {ch.participants.map(name => (
                  <button
                    key={name}
                    onClick={(e) => { e.stopPropagation(); onParticipantClick?.(name); }}
                    type="button"
                    title={name}
                    className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-secondary/60 hover:bg-tertiary text-muted-foreground hover:text-foreground transition-colors truncate max-w-[80px]"
                  >
                    <Avatar
                      size="xs3"
                      fallback={agents.find(a => a.name === name)?.initials ?? '?'}
                      name={name}
                    />
                    <span className="truncate">{name.split(' ')[0]}</span>
                  </button>
                ))}
                {ch.relatedTicketId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onTicketClick?.(ch.relatedTicketId); }}
                    type="button"
                    className="text-[9px] font-fustat px-1.5 py-0.5 rounded bg-chart-1/10 text-chart-1 hover:bg-chart-1/20 transition-colors shrink-0"
                  >
                    {ch.relatedTicketId}
                  </button>
                )}
                <span className="text-[9px] text-muted-foreground/60 shrink-0 ml-auto">
                  {ch.messageCount} msgs
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
