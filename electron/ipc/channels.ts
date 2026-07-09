import { ipcMain } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import type { Channel, ChannelMessage, CreateChannelInput } from '../../src/types/electron';
import { IPC } from './index';

const CHANNELS_DIR = path.join(os.homedir(), '.superhive', 'channels');

async function ensureChannelsDir(): Promise<void> {
	await fs.mkdir(CHANNELS_DIR, { recursive: true });
}

function getChannelPath(channelId: string): string {
	return path.join(CHANNELS_DIR, `${channelId}.json`);
}

function getChatFilePath(channelId: string): string {
	return path.join(CHANNELS_DIR, `${channelId}.jsonl`);
}

export function registerChannelsIpc(): void {
	ipcMain.handle(IPC.CHANNELS.CREATE, async (_, raw: CreateChannelInput) => {
		await ensureChannelsDir();
		const now = Date.now();
		const channel: Channel = {
			id: randomUUID(),
			name: raw.name,
			type: raw.type,
			projectId: raw.projectId,
			participantAgentIds: raw.participantAgentIds,
			startedAt: now,
			chatFile: getChatFilePath('').replace('_.jsonl', `${randomUUID()}.jsonl`).replace(CHANNELS_DIR, CHANNELS_DIR),
			createdAt: now,
			updatedAt: now,
		};
		channel.chatFile = path.join(CHANNELS_DIR, `${channel.id}.jsonl`);
		const channelPath = getChannelPath(channel.id);
		await fs.writeFile(channelPath, JSON.stringify(channel, null, 2), 'utf-8');
		return channel;
	});

	ipcMain.handle(IPC.CHANNELS.GET, async (_, id: string) => {
		const channelPath = getChannelPath(id);
		try {
			const raw = await fs.readFile(channelPath, 'utf-8');
			return JSON.parse(raw) as Channel;
		} catch {
			return null;
		}
	});

	ipcMain.handle(IPC.CHANNELS.LIST, async () => {
		await ensureChannelsDir();
		const files = await fs.readdir(CHANNELS_DIR);
		const channels: Channel[] = [];
		for (const file of files) {
			if (!file.endsWith('.json')) continue;
			try {
				const raw = await fs.readFile(path.join(CHANNELS_DIR, file), 'utf-8');
				channels.push(JSON.parse(raw) as Channel);
			} catch {
				// skip malformed files
			}
		}
		return channels;
	});

	ipcMain.handle(
		IPC.CHANNELS.APPEND_MESSAGE,
		async (_, channelId: string, raw: Omit<ChannelMessage, 'id' | 'timestamp'>) => {
			const chatPath = path.join(CHANNELS_DIR, `${channelId}.jsonl`);
			const message: ChannelMessage = {
				id: randomUUID(),
				timestamp: Date.now(),
				...raw,
			};
			const line = JSON.stringify(message) + '\n';
			await fs.appendFile(chatPath, line, 'utf-8');
			return message;
		},
	);

	ipcMain.handle(IPC.CHANNELS.READ_MESSAGES, async (_, channelId: string) => {
		const chatPath = path.join(CHANNELS_DIR, `${channelId}.jsonl`);
		try {
			const raw = await fs.readFile(chatPath, 'utf-8');
			const lines = raw.split('\n').filter(Boolean);
			return lines.map((line) => JSON.parse(line) as ChannelMessage);
		} catch {
			return [];
		}
	});
}
