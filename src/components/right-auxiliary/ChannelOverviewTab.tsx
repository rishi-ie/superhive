/**
 * Channel overview tab — displays channel topic, participants, related ticket, messages.
 */
import { Avatar } from '@/components/ui/Avatar';
import { ChannelStatusPill } from '@/components/channels';
import type { CommunicationChannel, ProjectAgent, ChannelMessage } from '@/data/projects/store';
import type { UniversalTicket } from '@/data/tickets/store';

type ChannelOverviewTabProps = {
  channel: CommunicationChannel;
  workspaceId: string;
  relatedTicket: UniversalTicket | null;
  participants: ProjectAgent[];
  recentMessages: ChannelMessage[];
  onParticipantClick?: (name: string) => void;
  onTicketClick?: (id: string) => void;
};

/**
 * Channel overview tab — displays channel topic, participants, related ticket, messages.
 * @param channel - Channel to display
 * @param workspaceId - Current workspace id
 * @param relatedTicket - Related ticket if any
 * @param participants - Channel participants
 * @param recentMessages - Recent messages to preview
 * @param onParticipantClick - Called when participant is clicked
 * @param onTicketClick - Called when related ticket is clicked
 */
export function ChannelOverviewTab({
  channel,
  relatedTicket,
  participants,
  recentMessages,
  onParticipantClick,
  onTicketClick,
}: ChannelOverviewTabProps) {
  const p0 = participants[0];
  const p1 = participants[1];

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-fustat text-muted-foreground bg-secondary/60 rounded px-1.5 py-0.5">
            {channel.id}
          </span>
          <ChannelStatusPill status={channel.status} />
        </div>
        <p className="text-sm font-semibold text-foreground leading-tight">{channel.topic}</p>
      </div>

      <div className="border-t border-border pt-2 space-y-1.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Participants</span>
        <div className="flex flex-col gap-1">
          {[p0, p1].filter(Boolean).map((p) => (
            <button
              key={p!.id}
              onClick={() => onParticipantClick?.(p!.name)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar size="xs" fallback={p!.initials} />
              <span className="text-xs text-foreground">{p!.name}</span>
              <span className="text-[10px] text-muted-foreground">{p!.role}</span>
            </button>
          ))}
        </div>
      </div>

      {relatedTicket && (
        <div className="border-t border-border pt-2 space-y-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Related Ticket</span>
          <button
            onClick={() => onTicketClick?.(relatedTicket.id)}
            className="text-[10px] font-fustat text-muted-foreground bg-secondary/60 rounded px-1.5 py-0.5 hover:text-foreground transition-colors"
          >
            {relatedTicket.id} · {relatedTicket.title}
          </button>
        </div>
      )}

      <div className="border-t border-border pt-2 space-y-1">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>{channel.messageCount} messages</span>
          <span>·</span>
          <span>{channel.updatedAt}</span>
          {channel.unread && (
            <>
              <span>·</span>
              <span className="text-chart-1">unread</span>
            </>
          )}
        </div>
      </div>

      {recentMessages.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">Recent Messages</span>
          <div className="space-y-1">
            {recentMessages.slice(0, 2).map(msg => {
              const agent = participants.find(p => p.name === msg.senderName);
              return (
                <div key={msg.id} className="flex items-start gap-1.5 text-[10px]">
                  <span className="text-muted-foreground/60 shrink-0 font-fustat">{msg.timestamp}</span>
                  <span className="font-semibold text-foreground shrink-0">{agent?.initials ?? msg.senderName.slice(0, 2).toUpperCase()}</span>
                  <span className="text-muted-foreground/80 truncate flex-1">{msg.content}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
