import { channels } from '@/api/channels';
import type { Channel, CreateChannelInput } from '@/types/electron';
import { toast } from 'sonner';

export interface CreateChannelResult {
	ok: boolean;
	channel?: Channel;
	error?: string;
}

export async function createChannel(
	input: CreateChannelInput,
): Promise<CreateChannelResult> {
	try {
		const channel = await channels.create(input);
		return { ok: true, channel };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to create channel';
		toast.error(message);
		return { ok: false, error: message };
	}
}
