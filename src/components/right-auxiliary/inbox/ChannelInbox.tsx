/**
 * Channel Inbox tab — mentions in a specific channel.
 */
import { EmptyState } from '@/components/right-auxiliary/shared/EmptyState';
import { CheckCircle } from 'lucide-react';

type ChannelInboxProps = {
  channelId: string;
};

/**
 * Channel Inbox tab — mentions in a specific channel.
 * @param channelId - The channel id to scope mentions to
 */
export function ChannelInbox(_props: ChannelInboxProps) {
  return (
    <EmptyState
      icon={<CheckCircle size={28} strokeWidth={1.5} />}
      title="No mentions"
      description="No mentions in this channel"
    />
  );
}
