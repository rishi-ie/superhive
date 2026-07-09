import type { Channel, ChannelMessage, ChannelsAPI, CreateChannelInput } from '@/types/electron';

async function create(input: CreateChannelInput): Promise<Channel> {
	return window.api.channels.create(input);
}

async function get(id: string): Promise<Channel | null> {
	return window.api.channels.get(id);
}

async function list(): Promise<Channel[]> {
	return window.api.channels.list();
}

async function appendMessage(
	channelId: string,
	message: Omit<ChannelMessage, 'id' | 'timestamp'>,
): Promise<ChannelMessage> {
	return window.api.channels.appendMessage(channelId, message);
}

async function readMessages(channelId: string): Promise<ChannelMessage[]> {
	return window.api.channels.readMessages(channelId);
}

export const channels: ChannelsAPI = {
	create,
	get,
	list,
	appendMessage,
	readMessages,
};
