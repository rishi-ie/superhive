/**
 * Pure business logic for project operations extracted from data/project/store.ts.
 * These helpers do validation, transformation, and shape building.
 * They do NOT call DataSource directly.
 */
import { getInitials } from '@/lib/initials';
import type { Agent } from '@/data/agent/interface';
import type {
  ProjectAgent,
  CreateProjectInput,
  ChannelStatus,
} from '@/data/project/interface';

/**
 * Input shape for the channel creation repository method.
 * Mirrors the parameter shape of ProjectsRepository.createChannel.
 */
export type ChannelInput = {
  projectId: string;
  topic: string;
  status: ChannelStatus;
  participants: string[];
  relatedTicketId?: string;
};

/**
 * Validates the title and workspace id requirements for a new project.
 * @param input - Raw input from the modal
 * @returns Trimmed title if valid; null if invalid
 */
export function validateProjectInput(input: CreateProjectInput): { title: string } | null {
  const title = input.title.trim();
  if (!title || !input.workspaceId) return null;
  return { title };
}

/**
 * Builds a ProjectAgent[] from agent ids by looking them up in the global agent list.
 * @param agentIds - Agent ids selected in the modal
 * @param allAgents - Global agents (from listAgents())
 * @returns ProjectAgent records with default IDLE status
 */
export function buildProjectAgents(agentIds: string[] | undefined, allAgents: Agent[]): ProjectAgent[] {
  return (agentIds ?? [])
    .map((agentId) => allAgents.find((a) => a.id === agentId))
    .filter((a): a is NonNullable<typeof a> => a !== undefined)
    .map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      currentStatus: 'IDLE' as const,
      assignedTicketId: null,
      initials: getInitials(a.name),
    }));
}

/**
 * Builds a ProjectAgent record from a single global agent.
 * @param agentId - Agent id to add
 * @param allAgents - Global agents (from listAgents())
 * @returns A ProjectAgent shape, or null if the agent id was not found
 */
export function buildProjectAgentForAgent(agentId: string, allAgents: Agent[]): ProjectAgent | null {
  const a = allAgents.find((g) => g.id === agentId);
  if (!a) return null;
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    currentStatus: 'IDLE',
    assignedTicketId: null,
    initials: getInitials(a.name),
  };
}

/**
 * Validates a channel creation input.
 * @param input - Raw input from the channel modal
 * @returns Normalized channel payload if valid; null otherwise
 */
export function validateChannelInput(input: {
  projectId: string;
  topic: string;
  status?: ChannelStatus;
  participants: string[];
  relatedTicketId?: string;
}): ChannelInput | null {
  if (!input.topic.trim() || !input.projectId) return null;
  return {
    projectId: input.projectId,
    topic: input.topic.trim(),
    status: input.status ?? 'OPEN',
    participants: input.participants,
    relatedTicketId: input.relatedTicketId,
  };
}
