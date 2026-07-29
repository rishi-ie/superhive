import type { OrchestrationCommandEnvelope, OrchestrationCommandType } from '../domain/commands'
import type { ProjectChannelMessage, WorkPacketV2, WorkerResultV1 } from '../domain/entities'
import {
  validatePolicy,
  type ProjectOrchestrationPolicyV1,
} from '../domain/policies'

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value as Record<string, unknown>
}

function text(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a non-empty string`)
  return value
}

const COMMAND_TYPES = new Set<OrchestrationCommandType>([
  'plan.propose',
  'iteration.dispatch',
  'iteration.progress',
  'iteration.result',
  'iteration.review',
  'message.send',
  'user-decision.request',
  'user-decision.resolve',
  'project.status.update',
])

export function parseCommandEnvelope(value: unknown): OrchestrationCommandEnvelope {
  const row = object(value, 'command')
  if (row.schemaVersion !== 1) throw new Error('Unsupported command schemaVersion')
  if (!COMMAND_TYPES.has(row.type as OrchestrationCommandType)) throw new Error('Unsupported command type')
  return {
    schemaVersion: 1,
    id: text(row.id, 'command.id'),
    type: row.type as OrchestrationCommandType,
    submittedAt: typeof row.submittedAt === 'number' ? row.submittedAt : Date.now(),
    projectId: text(row.projectId, 'command.projectId'),
    payload: object(row.payload, 'command.payload'),
  }
}

export function parseProjectPolicy(value: unknown): ProjectOrchestrationPolicyV1 {
  const policy = structuredClone(object(value, 'policy')) as unknown as ProjectOrchestrationPolicyV1
  validatePolicy(policy)
  return policy
}

export function parseWorkPacketV2(value: unknown): WorkPacketV2 {
  const packet = object(value, 'packet') as unknown as WorkPacketV2
  if (packet.schemaVersion !== 2) throw new Error('Unsupported packet schemaVersion')
  for (const [label, candidate] of [
    ['packet.projectId', packet.projectId],
    ['packet.planId', packet.planId],
    ['packet.taskId', packet.taskId],
    ['packet.iterationId', packet.iterationId],
    ['packet.coordinatorAgentId', packet.coordinatorAgentId],
    ['packet.workerAgentId', packet.workerAgentId],
    ['packet.objective', packet.objective],
    ['packet.digest', packet.digest],
  ] as const) text(candidate, label)
  if (!Array.isArray(packet.deliverables) || !Array.isArray(packet.definitionOfDone)) {
    throw new Error('packet deliverables and definitionOfDone must be arrays')
  }
  return packet
}

export function parseWorkerResult(value: unknown): WorkerResultV1 {
  const result = object(value, 'result') as unknown as WorkerResultV1
  if (result.schemaVersion !== 1) throw new Error('Unsupported result schemaVersion')
  for (const [label, candidate] of [
    ['result.id', result.id],
    ['result.projectId', result.projectId],
    ['result.taskId', result.taskId],
    ['result.iterationId', result.iterationId],
    ['result.workerAgentId', result.workerAgentId],
    ['result.summary', result.summary],
    ['result.digest', result.digest],
  ] as const) text(candidate, label)
  return result
}

export function parseProjectChannelMessage(value: unknown): ProjectChannelMessage {
  const message = object(value, 'message') as unknown as ProjectChannelMessage
  if (message.schemaVersion !== 2 || message.role !== 'project-channel') {
    throw new Error('Unsupported project message version')
  }
  text(message.id, 'message.id')
  text(message.projectId, 'message.projectId')
  text(message.text, 'message.text')
  return message
}
