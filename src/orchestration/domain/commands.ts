import type {
  IterationReviewV1,
  ProjectChannelMessage,
  ProjectPlanTaskV1,
  WorkPacketV2,
  WorkerResultV1,
} from './entities'

export type OrchestrationCommandType =
  | 'plan.propose'
  | 'iteration.dispatch'
  | 'iteration.progress'
  | 'iteration.result'
  | 'iteration.review'
  | 'message.send'
  | 'user-decision.request'
  | 'user-decision.resolve'
  | 'project.status.update'

export interface OrchestrationCommandEnvelope<T = unknown> {
  schemaVersion: 1
  id: string
  type: OrchestrationCommandType
  submittedAt: number
  projectId: string
  payload: T
}

export interface ProposePlanPayload {
  goal: string
  summary: string
  assumptions: string[]
  constraints: string[]
  tasks: Array<Omit<ProjectPlanTaskV1, 'id'>>
}

export interface DispatchIterationPayload {
  packet: Omit<WorkPacketV2, 'iterationId' | 'iterationNumber' | 'createdAt' | 'digest'>
}

export interface ReportProgressPayload {
  iterationId: string
  summary: string
  progress?: number
}

export interface ReportResultPayload {
  result: Omit<WorkerResultV1, 'id' | 'workerAgentId' | 'createdAt' | 'digest'>
}

export interface ReviewIterationPayload {
  review: Omit<IterationReviewV1, 'id' | 'coordinatorAgentId' | 'createdAt' | 'digest'>
  nextPacket?: DispatchIterationPayload['packet']
}

export interface SendMessagePayload {
  message: Omit<ProjectChannelMessage, 'schemaVersion' | 'id' | 'timestamp' | 'projectId' | 'actor'>
  blocksWork?: boolean
}

export interface UserDecisionPayload {
  question: string
  blocksProject: boolean
  taskId?: string
  iterationId?: string
}

export interface UpdateProjectStatusPayload {
  summary: string
  phase?: 'planning' | 'working' | 'waiting_for_agent' | 'waiting_for_user' | 'reporting' | 'blocked'
  progress?: number
}

export interface CommandActor {
  agentId: string
  displayName: string
  role: 'coordinator' | 'worker'
  projectId: string
}

export interface CommandResult {
  ok: boolean
  commandId: string
  eventIds: string[]
  recordId?: string
  error?: { code: string; message: string }
}

export interface CommandHandlerContext {
  actor: CommandActor
}

export type CommandHandler = (
  command: OrchestrationCommandEnvelope,
  context: CommandHandlerContext,
) => Promise<CommandResult>

export class CommandHandlerRegistry {
  private readonly handlers = new Map<OrchestrationCommandType, CommandHandler>()

  register(type: OrchestrationCommandType, handler: CommandHandler): void {
    if (this.handlers.has(type)) throw new Error(`Command handler already registered for ${type}`)
    this.handlers.set(type, handler)
  }

  get(type: OrchestrationCommandType): CommandHandler | undefined {
    return this.handlers.get(type)
  }
}
