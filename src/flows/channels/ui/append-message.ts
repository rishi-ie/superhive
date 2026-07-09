import { channels } from '@/api/channels';
import type { ChannelMessage } from '@/types/electron';

export async function appendMessage(
	channelId: string,
	senderType: ChannelMessage['senderType'],
	senderId: string,
	content: string,
): Promise<ChannelMessage> {
	return channels.appendMessage(channelId, { senderType, senderId, content });
}
