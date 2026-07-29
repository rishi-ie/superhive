export interface ProjectOrchestrationPolicyV1 {
  schemaVersion: 1
  execution: {
    requirePlanApproval: boolean
    allowParallelWork: boolean
    maxParallelIterations: number
    pauseBehavior: 'finish-current-turn' | 'stop-after-tool'
  }
  iterations: {
    maxIterationsPerTask: number
    requireProjectAgentReview: boolean
    allowWorkerSelfCompletion: false
    preferSameWorkerForRevision: boolean
  }
  communication: {
    allowWorkerToWorker: boolean
    maxUnresolvedThreadMessages: number
    wakeProjectAgentOnWorkerMessage: boolean
    showAllAgentMessagesInProjectChat: true
  }
  dispatch: {
    workerSelection: 'project-agent'
    oneActiveIterationPerWorker: boolean
    startIdleWorkersAutomatically: boolean
  }
  recovery: {
    resumeSameIterationAfterRestart: boolean
    automaticallyRestartAssignedWorker: boolean
    lateResultPolicy: 'retain-without-applying'
    duplicateCommandPolicy: 'return-existing-result'
  }
  activity: {
    showExplicitActivity: boolean
    inferSafeRuntimeActivity: boolean
    persistProgressMilestones: boolean
    exposeToolArguments: false
  }
  context: {
    includeFullProjectChatInWorkerPacket: false
    includeDependencySummaries: boolean
    includePriorIterationFeedback: boolean
  }
}

export type ProjectOrchestrationPolicyOverride = {
  [K in keyof ProjectOrchestrationPolicyV1]?: ProjectOrchestrationPolicyV1[K] extends object
    ? Partial<ProjectOrchestrationPolicyV1[K]>
    : ProjectOrchestrationPolicyV1[K]
}

export const DEFAULT_ORCHESTRATION_POLICY: ProjectOrchestrationPolicyV1 = {
  schemaVersion: 1,
  execution: {
    requirePlanApproval: true,
    allowParallelWork: true,
    maxParallelIterations: 4,
    pauseBehavior: 'finish-current-turn',
  },
  iterations: {
    maxIterationsPerTask: 5,
    requireProjectAgentReview: true,
    allowWorkerSelfCompletion: false,
    preferSameWorkerForRevision: true,
  },
  communication: {
    allowWorkerToWorker: true,
    maxUnresolvedThreadMessages: 8,
    wakeProjectAgentOnWorkerMessage: true,
    showAllAgentMessagesInProjectChat: true,
  },
  dispatch: {
    workerSelection: 'project-agent',
    oneActiveIterationPerWorker: true,
    startIdleWorkersAutomatically: true,
  },
  recovery: {
    resumeSameIterationAfterRestart: true,
    automaticallyRestartAssignedWorker: true,
    lateResultPolicy: 'retain-without-applying',
    duplicateCommandPolicy: 'return-existing-result',
  },
  activity: {
    showExplicitActivity: true,
    inferSafeRuntimeActivity: true,
    persistProgressMilestones: true,
    exposeToolArguments: false,
  },
  context: {
    includeFullProjectChatInWorkerPacket: false,
    includeDependencySummaries: true,
    includePriorIterationFeedback: true,
  },
}

export function resolvePolicy(
  defaults: ProjectOrchestrationPolicyV1 = DEFAULT_ORCHESTRATION_POLICY,
  override: ProjectOrchestrationPolicyOverride = {},
): ProjectOrchestrationPolicyV1 {
  const resolved: ProjectOrchestrationPolicyV1 = {
    schemaVersion: 1,
    execution: { ...defaults.execution, ...override.execution },
    iterations: { ...defaults.iterations, ...override.iterations },
    communication: { ...defaults.communication, ...override.communication },
    dispatch: { ...defaults.dispatch, ...override.dispatch },
    recovery: { ...defaults.recovery, ...override.recovery },
    activity: { ...defaults.activity, ...override.activity },
    context: { ...defaults.context, ...override.context },
  }
  validatePolicy(resolved)
  return resolved
}

export function validatePolicy(policy: ProjectOrchestrationPolicyV1): void {
  if (policy.schemaVersion !== 1) throw new Error('Unsupported orchestration policy version')
  if (!Number.isInteger(policy.execution.maxParallelIterations) || policy.execution.maxParallelIterations < 1) {
    throw new Error('maxParallelIterations must be a positive integer')
  }
  if (!Number.isInteger(policy.iterations.maxIterationsPerTask) || policy.iterations.maxIterationsPerTask < 1) {
    throw new Error('maxIterationsPerTask must be a positive integer')
  }
  if (!Number.isInteger(policy.communication.maxUnresolvedThreadMessages) || policy.communication.maxUnresolvedThreadMessages < 1) {
    throw new Error('maxUnresolvedThreadMessages must be a positive integer')
  }
}

