import { channels } from '@/api/channels';
import type { ChannelMessage } from '@/types/electron';

export async function loadMessages(channelId: string): Promise<ChannelMessage[]> {
	return channels.readMessages(channelId);
}
