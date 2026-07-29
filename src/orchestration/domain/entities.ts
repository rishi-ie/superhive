import type { ProjectOrchestrationPolicyV1 } from './policies'

export type ProjectExecutionState =
  | 'planning'
  | 'awaiting_approval'
  | 'running'
  | 'paused'
  | 'needs_user'
  | 'completed'
  | 'cancelled'

export type LoopTaskStatus =
  | 'todo'
  | 'running'
  | 'waiting'
  | 'reviewing'
  | 'blocked'
  | 'completed'
  | 'cancelled'

export type IterationStatus =
  | 'created'
  | 'dispatched'
  | 'running'
  | 'waiting'
  | 'reported'
  | 'accepted'
  | 'revision_requested'
  | 'failed'
  | 'cancelled'
  | 'expired'

export type ProjectActor =
  | { kind: 'user'; id: 'user'; displayName: string }
  | { kind: 'project-agent'; id: string; displayName: string }
  | { kind: 'worker'; id: string; displayName: string }
  | { kind: 'system'; id: 'system'; displayName: string }

export type ProjectMessageKind =
  | 'conversation'
  | 'handoff'
  | 'question'
  | 'answer'
  | 'progress'
  | 'result'
  | 'review'
  | 'status'

export interface ProjectPlanTaskV1 {
  id: string
  key: string
  title: string
  objective: string
  deliverables: string[]
  definitionOfDone: string[]
  dependencies: string[]
  preferredWorkerAgentId?: string
}

export interface ProjectPlanV1 {
  schemaVersion: 1
  id: string
  projectId: string
  version: number
  status: 'proposed' | 'approved' | 'superseded' | 'cancelled'
  goal: string
  summary: string
  assumptions: string[]
  constraints: string[]
  tasks: ProjectPlanTaskV1[]
  taskIds: string[]
  policySnapshot: ProjectOrchestrationPolicyV1
  createdByAgentId: string
  createdAt: number
  approvedAt?: number
  approvedBy?: 'user'
  digest: string
}

export interface LoopIterationV1 {
  schemaVersion: 1
  id: string
  projectId: string
  planId: string
  taskId: string
  number: number
  workerAgentId: string
  workerProfileId: string
  coordinatorAgentId: string
  status: IterationStatus
  policySnapshot: ProjectOrchestrationPolicyV1
  packetDigest: string
  resultDigest?: string
  reviewDigest?: string
  createdAt: number
  dispatchedAt?: number
  startedAt?: number
  reportedAt?: number
  reviewedAt?: number
  lastActivityAt?: number
}

export interface WorkPacketInputRef {
  kind: 'file' | 'artifact' | 'message' | 'task-result' | 'note'
  ref: string
  label: string
  digest?: string
}

export interface WorkPacketV2 {
  schemaVersion: 2
  projectId: string
  planId: string
  planVersion: number
  taskId: string
  iterationId: string
  iterationNumber: number
  coordinatorAgentId: string
  workerAgentId: string
  workerProfileId: string
  objective: string
  deliverables: string[]
  definitionOfDone: string[]
  constraints: string[]
  decisions: Array<{ summary: string; sourceEventId?: string }>
  inputs: WorkPacketInputRef[]
  dependencyOutputs: Array<{
    taskId: string
    summary: string
    artifactRefs: string[]
  }>
  priorIteration?: {
    iterationId: string
    summary: string
    reviewFeedback: string[]
  }
  permittedCommunication: {
    projectAgentId: string
    workerIds: string[]
  }
  createdAt: number
  digest: string
}

export interface WorkerResultDeliverable {
  label: string
  path?: string
  value?: string
  digest?: string
}

export interface WorkerResultEvidence {
  kind: 'test' | 'command' | 'file' | 'experiment' | 'citation' | 'observation'
  label: string
  value: string
}

export interface WorkerResultV1 {
  schemaVersion: 1
  id: string
  projectId: string
  taskId: string
  iterationId: string
  workerAgentId: string
  status: 'success' | 'partial' | 'blocked' | 'failed'
  summary: string
  deliverables: WorkerResultDeliverable[]
  evidence: WorkerResultEvidence[]
  remainingRisks: string[]
  questions: string[]
  late?: boolean
  createdAt: number
  digest: string
}

export interface IterationReviewV1 {
  schemaVersion: 1
  id: string
  projectId: string
  taskId: string
  iterationId: string
  coordinatorAgentId: string
  decision: 'accept' | 'revise' | 'block' | 'cancel'
  summary: string
  feedback: string[]
  acceptedDeliverables: string[]
  nextIterationId?: string
  createdAt: number
  digest: string
}

export interface ProjectChannelMessage {
  schemaVersion: 2
  id: string
  role: 'project-channel'
  timestamp: number
  projectId: string
  actor: ProjectActor
  recipients: ProjectActor[]
  kind: ProjectMessageKind
  text: string
  taskId?: string
  iterationId?: string
  replyToMessageId?: string
  questionThreadId?: string
}

export interface ProjectMessageReceipt {
  schemaVersion: 1
  id: string
  projectId: string
  messageId: string
  recipientAgentId: string
  state: 'sent' | 'delivered' | 'acknowledged'
  timestamp: number
}

export interface AgentActivitySnapshot {
  agentId: string
  projectId?: string
  taskId?: string
  iterationId?: string
  runtimeStatus: 'idle' | 'active' | 'busy' | 'waiting'
  phase:
    | 'idle'
    | 'starting'
    | 'planning'
    | 'reading_assignment'
    | 'working'
    | 'using_tool'
    | 'waiting_for_agent'
    | 'waiting_for_user'
    | 'reporting'
    | 'awaiting_review'
    | 'blocked'
    | 'error'
  summary: string
  progress?: number
  updatedAt: number
  durable: boolean
}

export interface WorkerExecutionSnapshot {
  agentId: string
  runtimeStatus: 'idle' | 'active' | 'busy' | 'waiting'
  availability: 'available' | 'working' | 'waiting' | 'awaiting_review' | 'error'
  currentTaskId?: string
  currentIterationId?: string
  activity?: AgentActivitySnapshot
  updatedAt: number
}

export interface ProjectExecutionSnapshot {
  schemaVersion: 1
  projectId: string
  state: ProjectExecutionState
  activePlanId?: string
  activePlanVersion?: number
  approvedPlanId?: string
  startedAt?: number
  pausedAt?: number
  completedAt?: number
  taskIds: string[]
  taskStatuses: Record<string, LoopTaskStatus>
  activeIterationIds: string[]
  iterations: Record<string, LoopIterationV1>
  queuedTaskIds: string[]
  blockedTaskIds: string[]
  unresolvedQuestionIds: string[]
  workers: Record<string, WorkerExecutionSnapshot>
  projectAgentActivity?: AgentActivitySnapshot
  lastAppliedSequence: number
  updatedAt: number
}

export interface WorkerProfileDefinition {
  id: string
  version: number
  label: string
  extensions: string[]
  systemPromptFragment: string
  supportedMessageKinds: ProjectMessageKind[]
  canReceiveWork: boolean
}
