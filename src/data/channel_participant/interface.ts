/**
 * channel_participants — per-channel participant registry with permissions.
 *
 * Tracks who (agent/user) is in a channel and what permissions they have.
 * Replaces any informal participant list with a proper join table.
 */
export type ChannelParticipant = {
  channelId: string;
  agentId: string;
  participantType: 'agent' | 'user' | 'workspace-agent' | 'project-agent';
  canRead: boolean;
  canWrite: boolean;
  joinedAt: string;
};
