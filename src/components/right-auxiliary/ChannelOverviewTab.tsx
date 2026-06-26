/**
 * Channel overview tab — displays channel topic, participants, related ticket, and full message thread.
 */
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Send } from 'lucide-react';
import { ChannelStatusPill } from '@/components/channels';
import { STROKE_WIDTH } from '@/lib/constants';
import type { CommunicationChannel, ProjectAgent, ChannelMessage } from '@/data/projects/store';
import type { UniversalTicket } from '@/data/tickets/store';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Textarea } from '@/components/ui/Textarea';

type ChannelOverviewTabProps = {
  channel: CommunicationChannel;
  relatedTicket: UniversalTicket | null;
  participants: ProjectAgent[];
  messages: ChannelMessage[];
  onParticipantClick?: (name: string) => void;
  onTicketClick?: (id: string) => void;
  onSend?: (content: string) => void;
};



/**
 * Channel overview tab — displays channel topic, participants, related ticket, and full message thread.
 * @param channel - Channel to display
 * @param relatedTicket - Related ticket if any
 * @param participants - Channel participants
 * @param messages - Messages to display
 * @param onParticipantClick - Called when participant is clicked
 * @param onTicketClick - Called when related ticket is clicked
 * @param onSend - Called when a message is sent
 */
export function ChannelOverviewTab({
  channel,
  relatedTicket,
  participants,
  messages,
  onParticipantClick,
  onTicketClick,
  onSend,
}: ChannelOverviewTabProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend?.(input.trim());
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-fustat text-muted-foreground bg-secondary/60 rounded px-1.5 py-0.5">
              {channel.id}
            </span>
            <ChannelStatusPill status={channel.status} />
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight">{channel.topic}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border pt-2">
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

        {/* Participants */}
        <div className="border-t border-border pt-2 space-y-2">
          <SectionLabel>Participants ({participants.length})</SectionLabel>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {participants.map((p) => (
              <button
                key={p.id}
                onClick={() => onParticipantClick?.(p.name)}
                className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity"
              >
                <Avatar size="xs" fallback={p.initials} />
                <span className="text-xs text-foreground">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Related Ticket */}
        {relatedTicket && (
          <div className="border-t border-border pt-2 space-y-1">
            <SectionLabel>Related Ticket</SectionLabel>
            <button
              onClick={() => onTicketClick?.(relatedTicket.id)}
              className="text-[10px] font-fustat text-muted-foreground bg-secondary/60 rounded px-1.5 py-0.5 hover:text-foreground transition-colors"
            >
              {relatedTicket.id} · {relatedTicket.title}
            </button>
          </div>
        )}

        {/* Message Thread */}
        <div className="border-t border-border pt-2 space-y-2">
          <SectionLabel>Messages</SectionLabel>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground/60 italic text-center py-4">No messages yet.</p>
            )}
            {messages.map((msg) => {
              const participant = participants.find(p => p.name === msg.senderName);
              const initials = participant?.initials ?? msg.senderName.slice(0, 2).toUpperCase();
              return (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar size="xs" fallback={initials} />
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-foreground">{msg.senderName}</span>
                      {msg.isAI && (
                        <Badge variant="ai">AI</Badge>
                      )}
                      <span className="text-[9px] text-muted-foreground/60 font-fustat">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compose */}
      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Send a message..."
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 size-8"
            size="sm"
          >
            <Send size={14} strokeWidth={STROKE_WIDTH} />
          </Button>
        </div>
      </div>
    </div>
  );
}
