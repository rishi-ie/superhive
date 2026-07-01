/**
 * channel_participants repository — thin wrapper over DataSource.channelParticipants.
 */
import type { DataSource } from '@/data/datasource/types';
import type { ChannelParticipant } from './interface';

export class ChannelParticipantsRepository {
  constructor(private ds: DataSource) {}

  listParticipants(channelId: string): ChannelParticipant[] {
    return this.ds.channelParticipants.findByChannelId(channelId) as ChannelParticipant[];
  }

  addParticipant(opts: { channelId: string; agentId: string; type?: string; canRead?: boolean; canWrite?: boolean }): ChannelParticipant {
    return this.ds.channelParticipants.create({
      channelId: opts.channelId,
      agentId: opts.agentId,
      participantType: opts.type ?? 'agent',
      canRead: opts.canRead ?? true,
      canWrite: opts.canWrite ?? true,
      joinedAt: new Date().toISOString(),
    }) as ChannelParticipant;
  }

  removeParticipant(channelId: string, agentId: string, type?: string): boolean {
    return this.ds.channelParticipants.remove(channelId, agentId, type ?? 'agent');
  }

  updatePermissions(channelId: string, agentId: string, patch: { canRead?: boolean; canWrite?: boolean }, type?: string): void {
    this.ds.channelParticipants.updatePermissions(channelId, agentId, type ?? 'agent', patch);
  }
}
