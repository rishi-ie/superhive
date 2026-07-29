export type InternalWakeReason =
  | 'plan_approved'
  | 'assignment_ready'
  | 'agent_message'
  | 'worker_question'
  | 'worker_result'
  | 'command_rejected'
  | 'user_decision'
  | 'resume_after_restart'

export interface InternalWake {
  id: string
  agentId: string
  reason: InternalWakeReason
  projectId: string
  taskId?: string
  iterationId?: string
  messageId?: string
}

export interface InternalWakeQueue {
  enqueue(wake: InternalWake): Promise<void>
  cancel(predicate: (wake: InternalWake) => boolean): Promise<void>
  pending(agentId: string): readonly InternalWake[]
}
