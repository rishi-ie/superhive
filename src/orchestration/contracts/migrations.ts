import type { WorkPacket } from '@/models/work-packet'
import type { WorkPacketV2 } from '../domain/entities'

export interface LegacyProjectChatRow {
  id: string
  ts: number
  role: 'user' | 'assistant'
  parts: Array<{ type: string; text?: string }>
  fromAgentId?: string
  fromAgentName?: string
  kind?: string
  refMessageId?: string
}

export function migrateLegacyProjectChatRow(
  row: LegacyProjectChatRow,
  projectId: string,
  coordinatorAgentId: string,
  coordinatorName: string,
) {
  const isWorker = row.role === 'assistant' && Boolean(row.fromAgentId) && row.fromAgentId !== coordinatorAgentId
  const actor = row.role === 'user'
    ? { kind: 'user' as const, id: 'user' as const, displayName: 'You' }
    : isWorker
      ? { kind: 'worker' as const, id: row.fromAgentId!, displayName: row.fromAgentName || 'Worker' }
      : { kind: 'project-agent' as const, id: coordinatorAgentId, displayName: coordinatorName }
  const text = row.parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
  return {
    schemaVersion: 2 as const,
    id: row.id,
    role: 'project-channel' as const,
    timestamp: row.ts,
    projectId,
    actor,
    recipients: [],
    kind: row.kind === 'question' ? 'question' as const : 'conversation' as const,
    text,
    replyToMessageId: row.refMessageId,
  }
}

export async function normalizeWorkPacketV1(
  packet: WorkPacket,
  input: {
    planId: string
    planVersion: number
    iterationId: string
    iterationNumber: number
    workerProfileId: string
    createdAt: number
    digest: (value: unknown) => Promise<string>
  },
): Promise<WorkPacketV2> {
  const unsigned = {
    schemaVersion: 2 as const,
    projectId: packet.projectId,
    planId: input.planId,
    planVersion: input.planVersion,
    taskId: packet.taskId,
    iterationId: input.iterationId,
    iterationNumber: input.iterationNumber,
    coordinatorAgentId: packet.coordinatorAgentId,
    workerAgentId: packet.workerAgentId,
    workerProfileId: input.workerProfileId,
    objective: packet.objective,
    deliverables: packet.deliverables,
    definitionOfDone: [packet.definitionOfDone],
    constraints: packet.constraints,
    decisions: packet.decisions.map((summary) => ({ summary })),
    inputs: packet.inputs.map((ref) => ({ kind: 'note' as const, ref, label: ref })),
    dependencyOutputs: packet.dependencyOutputs.map((summary, index) => ({
      taskId: `legacy-dependency-${index + 1}`,
      summary,
      artifactRefs: [],
    })),
    permittedCommunication: {
      projectAgentId: packet.coordinatorAgentId,
      workerIds: [packet.workerAgentId],
    },
    createdAt: input.createdAt,
  }
  return { ...unsigned, digest: await input.digest(unsigned) }
}

