/**
 * channel_participants store — public API for channel participants.
 */
import { getDataSource } from '@/data/datasource/index';
import { ChannelParticipantsRepository } from './repository';
import type { ChannelParticipant } from './interface';

const repo = new ChannelParticipantsRepository(getDataSource());

export function listChannelParticipants(channelId: string): ChannelParticipant[] {
  return repo.listParticipants(channelId);
}

export function addChannelParticipant(opts: { channelId: string; agentId: string; type?: string; canRead?: boolean; canWrite?: boolean }): ChannelParticipant {
  return repo.addParticipant(opts);
}

export function removeChannelParticipant(channelId: string, agentId: string, type?: string): boolean {
  return repo.removeParticipant(channelId, agentId, type);
}

export function updateChannelParticipantPermissions(channelId: string, agentId: string, patch: { canRead?: boolean; canWrite?: boolean }, type?: string): void {
  repo.updatePermissions(channelId, agentId, patch, type);
}

export type { ChannelParticipant };
