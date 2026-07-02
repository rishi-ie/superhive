/**
 * Channel Inbox tab — recent messages in a specific channel.
 */
import { Hash } from 'lucide-react';
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { listChannelMessages } from '@/data/projects/store';
import type { ChannelMessage } from '@/data/projects/store';

type ChannelInboxProps = {
  channelId: string;
};

/**
 * Channel Inbox tab — recent messages in a specific channel.
 * @param channelId - The channel id to scope mentions to
 */
export function ChannelInbox({ channelId }: ChannelInboxProps) {
  const messages = listChannelMessages(channelId);

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<Hash size={28} strokeWidth={1.5} />}
        title="No messages yet"
        description="Start the conversation to see messages here"
      />
    );
  }

  const recent = [...messages].reverse().slice(0, 50);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 shrink-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Recent messages
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 space-y-1 py-1">
        {recent.map(msg => (
          <MessageRow key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}

function MessageRow({ message }: { message: ChannelMessage }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Avatar
        name={message.senderName}
        size="xs3"
        color={message.isAI ? 'bg-chart-1' : 'bg-chart-2'}
        className="font-bold text-sidebar-primary-foreground shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-[10px] font-semibold text-foreground shrink-0">
            {message.senderName}
          </span>
          <span className="text-[9px] text-muted-foreground/60 font-fustat">
            {message.timestamp}
          </span>
          {message.isAI && (
            <span className="text-[8px] text-chart-1 font-medium uppercase tracking-wider">AI</span>
          )}
        </div>
        <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">
          {message.content}
        </p>
      </div>
    </div>
  );
}
