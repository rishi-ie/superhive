/**
 * Project communications grid showing channels and participants.
 */
import { Avatar } from '@/components/ui/Avatar';
import { ChannelStatusPill } from '@/components/channels';
import type { CommunicationChannel, ProjectAgent } from '@/data/projects/store';

type CommunicationsProps = {
  channels: CommunicationChannel[];
  agents: ProjectAgent[];
  onChannelClick?: (id: string, workspaceId: string) => void;
  onParticipantClick?: (name: string) => void;
  onTicketClick?: (id: string) => void;
};

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
                <button
                  onClick={() => onParticipantClick?.(ch.participants[0] ?? '')}
                  type="button"
                  className="absolute top-0 left-0"
                >
                  <Avatar
                    size="xs"
                    fallback={a?.initials ?? '?'}
                    className="ring-1 ring-card"
                  />
                </button>
                <button
                  onClick={() => onParticipantClick?.(ch.participants[1] ?? '')}
                  type="button"
                  className="absolute bottom-0 right-0"
                >
                  <Avatar
                    size="xs"
                    fallback={b?.initials ?? '?'}
                    className="ring-1 ring-card"
                  />
                </button>
              </div>

              <button
                onClick={() => onChannelClick?.(ch.id, ch.workspaceId ?? '')}
                type="button"
                className="flex-1 min-w-0 flex flex-col gap-0.5 text-left"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">{ch.topic}</span>
                  {ch.unread && <span className="size-1.5 rounded-full bg-chart-1 shrink-0" />}
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{ch.lastMessagePreview}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onParticipantClick?.(ch.participants[0] ?? ''); }}
                    type="button"
                    className="text-[9px] text-muted-foreground/70 truncate hover:text-foreground transition-colors"
                  >
                    {ch.participants[0]}
                  </button>
                  <span className="text-muted-foreground/40 shrink-0">↔</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onParticipantClick?.(ch.participants[1] ?? ''); }}
                    type="button"
                    className="text-[9px] text-muted-foreground/70 truncate hover:text-foreground transition-colors"
                  >
                    {ch.participants[1]}
                  </button>
                  <span className="text-muted-foreground/40 shrink-0">·</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onTicketClick?.(ch.relatedTicketId); }}
                    type="button"
                    className="text-[9px] font-fustat text-muted-foreground bg-secondary/80 rounded px-1 py-0.5 hover:text-foreground transition-colors"
                  >
                    {ch.relatedTicketId}
                  </button>
                  <span className="text-muted-foreground/40 shrink-0">·</span>
                  <span className="text-[9px] text-muted-foreground/70 shrink-0">{ch.messageCount} msgs</span>
                </div>
              </button>

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