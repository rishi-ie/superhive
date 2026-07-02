/**
 * channels store — thin wrapper over projects store for channel-level operations.
 *
 * Channels are embedded in Project.data JSON. This module provides channel-centric
 * access without needing the parent project context.
 */
import { patchChannel, findProjectByChannelId } from '@/data/projects/store';
import type { CommunicationChannel } from '@/data/projects/store';

export function updateChannel(channelId: string, patch: Partial<Pick<CommunicationChannel, 'topic' | 'status' | 'participants'>>): CommunicationChannel | undefined {
  return patchChannel(channelId, patch);
}

export function getProjectForChannel(channelId: string) {
  return findProjectByChannelId(channelId);
}
