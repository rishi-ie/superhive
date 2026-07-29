import type {
  CommandActor,
  CommandResult,
  DispatchIterationPayload,
  OrchestrationCommandEnvelope,
  ProposePlanPayload,
  ReportProgressPayload,
  ReportResultPayload,
  ReviewIterationPayload,
  SendMessagePayload,
  UserDecisionPayload,
  OrchestrationCommandType,
  UpdateProjectStatusPayload,
} from '../domain/commands'
import type {
  IterationReviewV1,
  LoopIterationV1,
  ProjectActor,
  ProjectChannelMessage,
  ProjectExecutionSnapshot,
  ProjectPlanV1,
  WorkPacketV2,
  WorkerResultV1,
} from '../domain/entities'
import {
  createDefaultEventReducers,
  createEmptyProjectSnapshot,
  type ProjectEventV1,
  type UncommittedProjectEvent,
} from '../domain/events'
import { invariant, OrchestrationError } from '../domain/errors'
import {
  DEFAULT_ORCHESTRATION_POLICY,
  resolvePolicy,
  type ProjectOrchestrationPolicyOverride,
  type ProjectOrchestrationPolicyV1,
} from '../domain/policies'
import type {
  AgentRuntimeGateway,
  Clock,
  DigestService,
  IdGenerator,
  InternalWakeQueue,
  OrchestrationNotifier,
  OrchestrationRecordStore,
  ProjectAgentDirectory,
  ProjectConversationStore,
  ProjectContextProvider,
  ProjectEventStore,
  ProjectSnapshotStore,
  TaskProjection,
  WorkerAssignmentStore,
  WorkerProfileRegistry,
} from '../ports'

export interface OrchestrationDependencies {
  eventStore: ProjectEventStore
  snapshotStore: ProjectSnapshotStore
  recordStore: OrchestrationRecordStore
  conversationStore: ProjectConversationStore
  taskProjection: TaskProjection
  runtimeGateway: AgentRuntimeGateway
  wakeQueue: InternalWakeQueue
  clock: Clock
  ids: IdGenerator
  digests: DigestService
  notifier: OrchestrationNotifier
  agents: ProjectAgentDirectory
  assignmentStore: WorkerAssignmentStore
  contextProvider?: ProjectContextProvider
  workerProfiles: WorkerProfileRegistry
  readPolicyOverride?: (projectId: string) => Promise<ProjectOrchestrationPolicyOverride>
}

function actorFromCommand(actor: CommandActor): ProjectActor {
  return actor.role === 'coordinator'
    ? { kind: 'project-agent', id: actor.agentId, displayName: actor.displayName }
    : { kind: 'worker', id: actor.agentId, displayName: actor.displayName }
}

const userActor: ProjectActor = { kind: 'user', id: 'user', displayName: 'You' }

export class OrchestrationService {
  private readonly reducers = createDefaultEventReducers()
  private readonly processed = new Map<string, CommandResult>()
  private readonly commandHandlers = new Map<
    OrchestrationCommandType,
    (command: OrchestrationCommandEnvelope, actor: CommandActor) => Promise<CommandResult>
  >()

  constructor(private readonly deps: OrchestrationDependencies) {
    this.commandHandlers.set('plan.propose', (command, actor) =>
      this.proposePlan(command, actor, command.payload as ProposePlanPayload))
    this.commandHandlers.set('iteration.dispatch', (command, actor) =>
      this.dispatchIteration(command, actor, command.payload as DispatchIterationPayload))
    this.commandHandlers.set('iteration.progress', (command, actor) =>
      this.reportProgress(command, actor, command.payload as ReportProgressPayload))
    this.commandHandlers.set('iteration.result', (command, actor) =>
      this.reportResult(command, actor, command.payload as ReportResultPayload))
    this.commandHandlers.set('iteration.review', (command, actor) =>
      this.reviewIteration(command, actor, command.payload as ReviewIterationPayload))
    this.commandHandlers.set('message.send', (command, actor) =>
      this.sendMessage(command, actor, command.payload as SendMessagePayload))
    this.commandHandlers.set('user-decision.request', (command, actor) =>
      this.requestUserDecision(command, actor, command.payload as UserDecisionPayload))
    this.commandHandlers.set('user-decision.resolve', (command, actor) =>
      this.resolveUserDecision(command, actor, command.payload as { messageId: string }))
    this.commandHandlers.set('project.status.update', (command, actor) =>
      this.updateProjectStatus(command, actor, command.payload as UpdateProjectStatusPayload))
  }

  async getProjectSnapshot(projectId: string): Promise<ProjectExecutionSnapshot> {
    const saved = await this.deps.snapshotStore.read(projectId)
    if (saved) return saved
    let snapshot = createEmptyProjectSnapshot(projectId, this.deps.clock.now())
    for await (const event of this.deps.eventStore.read(projectId)) {
      snapshot = this.reducers.reduce(snapshot, event)
    }
    await this.deps.snapshotStore.write(snapshot)
    return snapshot
  }

  async rebuildProjectSnapshot(projectId: string): Promise<ProjectExecutionSnapshot> {
    let snapshot = createEmptyProjectSnapshot(projectId, this.deps.clock.now())
    for await (const event of this.deps.eventStore.read(projectId)) {
      snapshot = this.reducers.reduce(snapshot, event)
    }
    await this.deps.snapshotStore.write(snapshot)
    this.deps.notifier.projectChanged(snapshot)
    for (const worker of Object.values(snapshot.workers)) {
      this.deps.notifier.agentChanged(worker)
    }
    return snapshot
  }

  async execute(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
  ): Promise<CommandResult> {
    const previous = this.processed.get(command.id)
    if (previous) return previous
    invariant(command.schemaVersion === 1, 'unsupported_command_version', 'Unsupported command version')
    invariant(command.projectId === actor.projectId, 'project_mismatch', 'Command project does not match actor project')

    try {
      const durable = await this.findDurableCommandResult(command)
      if (durable) {
        this.processed.set(command.id, durable)
        return durable
      }
      const handler = this.commandHandlers.get(command.type)
      invariant(handler, 'unsupported_command', `Unsupported command type: ${command.type}`)
      const result = await handler(command, actor)
      this.processed.set(command.id, result)
      return result
    } catch (error) {
      const typed = error instanceof OrchestrationError
        ? error
        : new OrchestrationError('command_failed', error instanceof Error ? error.message : String(error))
      const result: CommandResult = {
        ok: false,
        commandId: command.id,
        eventIds: [],
        error: { code: typed.code, message: typed.message },
      }
      this.processed.set(command.id, result)
      return result
    }
  }

  private async findDurableCommandResult(
    command: OrchestrationCommandEnvelope,
  ): Promise<CommandResult | null> {
    const matches: ProjectEventV1[] = []
    for await (const event of this.deps.eventStore.read(command.projectId)) {
      if (event.correlationId === command.id) matches.push(event)
    }
    if (matches.length === 0) return null
    const payload = matches.at(-1)?.payload ?? {}
    const recordId = [
      payload.planId,
      payload.iterationId,
      payload.resultId,
      payload.reviewId,
      matches.at(-1)?.messageId,
    ].find((value): value is string => typeof value === 'string')
    return {
      ok: true,
      commandId: command.id,
      eventIds: matches.map((event) => event.id),
      recordId,
    }
  }

  private correlate(
    command: OrchestrationCommandEnvelope,
    events: UncommittedProjectEvent[],
  ): UncommittedProjectEvent[] {
    return events.map((event) => ({ ...event, correlationId: command.id }))
  }

  async approvePlan(projectId: string, planId: string): Promise<ProjectExecutionSnapshot> {
    const snapshot = await this.getProjectSnapshot(projectId)
    invariant(snapshot.state === 'awaiting_approval', 'not_awaiting_approval', 'Project is not awaiting approval')
    invariant(snapshot.activePlanId === planId, 'stale_plan', 'Only the current proposed plan can be approved')
    const plan = await this.deps.recordStore.readPlan(projectId, planId)
    invariant(plan, 'plan_not_found', 'Plan not found')

    const events = await this.commit(projectId, [
      { type: 'plan.approved', actor: userActor, payload: { planId } },
      { type: 'execution.started', actor: userActor, payload: { planId } },
    ])
    const coordinator = await this.deps.agents.coordinator(projectId)
    if (coordinator) {
      await this.deps.wakeQueue.enqueue({
        id: events[1]!.id,
        agentId: coordinator.id,
        reason: 'plan_approved',
        projectId,
      })
    }
    return this.getProjectSnapshot(projectId)
  }

  async pauseProject(projectId: string): Promise<ProjectExecutionSnapshot> {
    const snapshot = await this.getProjectSnapshot(projectId)
    invariant(snapshot.state === 'running' || snapshot.state === 'needs_user', 'cannot_pause', 'Project cannot be paused')
    await this.commit(projectId, [{ type: 'execution.paused', actor: userActor, payload: {} }])
    return this.getProjectSnapshot(projectId)
  }

  async resumeProject(projectId: string): Promise<ProjectExecutionSnapshot> {
    const snapshot = await this.getProjectSnapshot(projectId)
    invariant(snapshot.state === 'paused', 'cannot_resume', 'Project is not paused')
    await this.commit(projectId, [{ type: 'execution.resumed', actor: userActor, payload: {} }])
    return this.getProjectSnapshot(projectId)
  }

  async cancelProject(projectId: string): Promise<ProjectExecutionSnapshot> {
    const snapshot = await this.getProjectSnapshot(projectId)
    invariant(snapshot.state !== 'completed' && snapshot.state !== 'cancelled', 'cannot_cancel', 'Project is already terminal')
    await this.deps.wakeQueue.cancel((wake) => wake.projectId === projectId)
    await this.commit(projectId, [{ type: 'execution.cancelled', actor: userActor, payload: {} }])
    return this.getProjectSnapshot(projectId)
  }

  private async policy(projectId: string): Promise<ProjectOrchestrationPolicyV1> {
    const override = await this.deps.readPolicyOverride?.(projectId) ?? {}
    return resolvePolicy(DEFAULT_ORCHESTRATION_POLICY, override)
  }

  private requireCoordinator(actor: CommandActor): void {
    invariant(actor.role === 'coordinator', 'coordinator_required', 'Only the Project Agent can perform this action')
  }

  private async proposePlan(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: ProposePlanPayload,
  ): Promise<CommandResult> {
    this.requireCoordinator(actor)
    invariant(payload.goal?.trim(), 'invalid_goal', 'Plan goal is required')
    invariant(payload.tasks?.length > 0, 'invalid_tasks', 'Plan must contain at least one task')
    const keys = new Set(payload.tasks.map((task) => task.key))
    invariant(keys.size === payload.tasks.length && !keys.has(''), 'duplicate_task_key', 'Task keys must be unique and non-empty')
    for (const task of payload.tasks) {
      for (const dependency of task.dependencies) {
        invariant(keys.has(dependency), 'unknown_dependency', `Unknown dependency key: ${dependency}`)
      }
    }
    assertAcyclic(payload.tasks.map((task) => ({ key: task.key, dependencies: task.dependencies })))

    const current = await this.getProjectSnapshot(command.projectId)
    invariant(
      current.state === 'planning' || current.state === 'awaiting_approval',
      'execution_already_started',
      'An executing project must be paused and replanned through the user flow',
    )
    const plans = await this.deps.recordStore.listPlans(command.projectId)
    const version = Math.max(0, ...plans.map((plan) => plan.version)) + 1
    const planId = this.deps.ids.next()
    const tasks = await this.deps.taskProjection.createPlanTasks(command.projectId, planId, payload.tasks)
    const policySnapshot = await this.policy(command.projectId)
    const unsigned = {
      schemaVersion: 1 as const,
      id: planId,
      projectId: command.projectId,
      version,
      status: 'proposed' as const,
      goal: payload.goal.trim(),
      summary: payload.summary.trim(),
      assumptions: payload.assumptions.map((item) => item.trim()).filter(Boolean),
      constraints: payload.constraints.map((item) => item.trim()).filter(Boolean),
      tasks,
      taskIds: tasks.map((task) => task.id),
      policySnapshot,
      createdByAgentId: actor.agentId,
      createdAt: this.deps.clock.now(),
    }
    const plan: ProjectPlanV1 = { ...unsigned, digest: await this.deps.digests.digest(unsigned) }
    await this.deps.recordStore.writePlan(plan)

    const pending: UncommittedProjectEvent[] = []
    if (current.activePlanId) {
      pending.push({
        type: 'plan.superseded',
        actor: actorFromCommand(actor),
        payload: { planId: current.activePlanId, supersededBy: plan.id },
      })
    }
    pending.push({
      type: 'plan.proposed',
      actor: actorFromCommand(actor),
      payload: { planId: plan.id, version: plan.version, taskIds: plan.taskIds },
    })
    const events = await this.commit(command.projectId, this.correlate(command, pending))
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id), recordId: plan.id }
  }

  private async dispatchIteration(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: DispatchIterationPayload,
  ): Promise<CommandResult> {
    this.requireCoordinator(actor)
    const snapshot = await this.getProjectSnapshot(command.projectId)
    invariant(snapshot.state === 'running', 'project_not_running', 'Project must be running before dispatch')
    invariant(snapshot.approvedPlanId === payload.packet.planId, 'unapproved_plan', 'Work packet must belong to the approved plan')
    const task = await this.deps.taskProjection.get(payload.packet.taskId)
    invariant(task && task.projectId === command.projectId, 'task_not_found', 'Task not found')
    invariant(task.status === 'todo' || task.status === 'running' || task.status === 'blocked', 'task_not_dispatchable', 'Task is not dispatchable')
    const tasks = await this.deps.taskProjection.list(command.projectId)
    invariant(
      task.dependencies.every((id) => tasks.find((candidate) => candidate.id === id)?.status === 'completed'),
      'dependencies_incomplete',
      'Task dependencies are not complete',
    )
    const policy = await this.policy(command.projectId)
    const active = snapshot.activeIterationIds
      .map((id) => snapshot.iterations[id])
      .filter(Boolean)
    invariant(
      !policy.execution.allowParallelWork ? active.length === 0 : active.length < policy.execution.maxParallelIterations,
      'parallel_limit',
      'Project parallel iteration limit reached',
    )
    invariant(
      !policy.dispatch.oneActiveIterationPerWorker || !active.some((item) => item!.workerAgentId === payload.packet.workerAgentId),
      'worker_busy',
      'Worker already owns an active iteration',
    )
    const worker = await this.deps.agents.get(payload.packet.workerAgentId)
    invariant(worker?.projectId === command.projectId && worker.role === 'worker', 'invalid_worker', 'Worker is not assigned to this project')
    const profile = this.deps.workerProfiles.get(payload.packet.workerProfileId)
    invariant(profile?.canReceiveWork, 'invalid_worker_profile', 'Worker profile cannot receive work')
    invariant(
      !worker.workerProfileId || worker.workerProfileId === profile.id,
      'worker_profile_mismatch',
      'Worker does not match the requested profile',
    )
    const count = task.iterationCount + 1
    invariant(count <= policy.iterations.maxIterationsPerTask, 'iteration_limit', 'Task iteration limit reached')

    const iterationId = this.deps.ids.next()
    const createdAt = this.deps.clock.now()
    const context = await this.deps.contextProvider?.getWorkerPacketContext({
      projectId: command.projectId,
      coordinatorAgentId: actor.agentId,
      taskId: payload.packet.taskId,
      planId: payload.packet.planId,
      references: [
        { kind: 'plan', ref: payload.packet.planId },
        { kind: 'task', ref: payload.packet.taskId },
        ...payload.packet.inputs.map((input) => ({ kind: input.kind, ref: input.ref })),
      ],
    })
    const unsignedPacket = {
      ...payload.packet,
      inputs: [
        ...payload.packet.inputs,
        ...(context?.inputs ?? []).filter((candidate) =>
          !payload.packet.inputs.some((input) => input.ref === candidate.ref)),
      ],
      schemaVersion: 2 as const,
      iterationId,
      iterationNumber: count,
      createdAt,
    }
    const packet: WorkPacketV2 = {
      ...unsignedPacket,
      digest: await this.deps.digests.digest(unsignedPacket),
    }
    const iteration: LoopIterationV1 = {
      schemaVersion: 1,
      id: iterationId,
      projectId: command.projectId,
      planId: packet.planId,
      taskId: packet.taskId,
      number: count,
      workerAgentId: worker.id,
      workerProfileId: packet.workerProfileId,
      coordinatorAgentId: actor.agentId,
      status: 'created',
      policySnapshot: policy,
      packetDigest: packet.digest,
      createdAt,
    }
    await this.deps.recordStore.writePacket(packet)
    await this.deps.recordStore.writeIteration(iteration)
    await this.deps.assignmentStore.write(packet)
    await this.deps.taskProjection.assignIteration(task.id, worker.id, iteration.id)
    const events = await this.commit(command.projectId, this.correlate(command, [
      {
        type: 'iteration.created',
        actor: actorFromCommand(actor),
        taskId: task.id,
        iterationId,
        payload: { iteration },
      },
      {
        type: 'iteration.dispatched',
        actor: actorFromCommand(actor),
        taskId: task.id,
        iterationId,
        payload: { packetDigest: packet.digest },
      },
    ]))
    await this.appendMessage(actor, {
      message: {
        role: 'project-channel',
        recipients: [{ kind: 'worker', id: worker.id, displayName: worker.name }],
        kind: 'handoff',
        text: packet.objective,
        taskId: task.id,
        iterationId,
      },
    })
    await this.deps.wakeQueue.enqueue({
      id: events[1]!.id,
      agentId: worker.id,
      reason: 'assignment_ready',
      projectId: command.projectId,
      taskId: task.id,
      iterationId,
    })
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id), recordId: iterationId }
  }

  private async reportProgress(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: ReportProgressPayload,
  ): Promise<CommandResult> {
    invariant(actor.role === 'worker', 'worker_required', 'Only workers report iteration progress')
    const iteration = (await this.getProjectSnapshot(command.projectId)).iterations[payload.iterationId]
    invariant(iteration?.workerAgentId === actor.agentId, 'iteration_not_owned', 'Worker does not own this iteration')
    invariant(['dispatched', 'running', 'waiting'].includes(iteration.status), 'iteration_not_active', 'Iteration is not active')
    invariant(payload.summary?.trim(), 'invalid_summary', 'Progress summary is required')
    if (payload.progress !== undefined) {
      invariant(payload.progress >= 0 && payload.progress <= 100, 'invalid_progress', 'Progress must be between 0 and 100')
    }
    const events = await this.commit(command.projectId, this.correlate(command, [{
      type: 'iteration.progressed',
      actor: actorFromCommand(actor),
      taskId: iteration.taskId,
      iterationId: iteration.id,
      payload: { summary: payload.summary.trim(), progress: payload.progress },
    }]))
    if ((await this.policy(command.projectId)).activity.persistProgressMilestones) {
      await this.appendMessage(actor, {
        message: {
          role: 'project-channel',
          recipients: [],
          kind: 'progress',
          text: payload.summary.trim(),
          taskId: iteration.taskId,
          iterationId: iteration.id,
        },
      })
    }
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id) }
  }

  private async reportResult(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: ReportResultPayload,
  ): Promise<CommandResult> {
    invariant(actor.role === 'worker', 'worker_required', 'Only workers report results')
    const snapshot = await this.getProjectSnapshot(command.projectId)
    const iteration = snapshot.iterations[payload.result.iterationId]
    invariant(iteration?.workerAgentId === actor.agentId, 'iteration_not_owned', 'Worker does not own this iteration')
    const existing = await this.deps.recordStore.readResult(command.projectId, iteration.id)
    if (existing) return { ok: true, commandId: command.id, eventIds: [], recordId: existing.id }
    const active = snapshot.activeIterationIds.includes(iteration.id)
      && snapshot.state !== 'cancelled'
      && ['dispatched', 'running', 'waiting'].includes(iteration.status)
    const policy = await this.policy(command.projectId)
    invariant(
      active || policy.recovery.lateResultPolicy === 'retain-without-applying',
      'iteration_not_active',
      'Iteration is not active',
    )
    const unsigned = {
      ...payload.result,
      schemaVersion: 1 as const,
      id: this.deps.ids.next(),
      workerAgentId: actor.agentId,
      late: active ? undefined : true,
      createdAt: this.deps.clock.now(),
    }
    const result: WorkerResultV1 = { ...unsigned, digest: await this.deps.digests.digest(unsigned) }
    await this.deps.recordStore.writeResult(result)
    const events = await this.commit(command.projectId, this.correlate(command, [{
      type: active ? 'iteration.reported' : 'iteration.late_result_retained',
      actor: actorFromCommand(actor),
      taskId: iteration.taskId,
      iterationId: iteration.id,
      payload: { resultId: result.id, resultDigest: result.digest, status: result.status },
    }]))
    const coordinator = await this.deps.agents.coordinator(command.projectId)
    await this.appendMessage(actor, {
      message: {
        role: 'project-channel',
        recipients: coordinator
          ? [{ kind: 'project-agent', id: coordinator.id, displayName: coordinator.name }]
          : [],
        kind: 'result',
        text: result.late ? `Late result retained without applying: ${result.summary}` : result.summary,
        taskId: result.taskId,
        iterationId: result.iterationId,
      },
    })
    if (coordinator) {
      await this.deps.wakeQueue.enqueue({
        id: events[0]!.id,
        agentId: coordinator.id,
        reason: 'worker_result',
        projectId: command.projectId,
        taskId: iteration.taskId,
        iterationId: iteration.id,
      })
    }
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id), recordId: result.id }
  }

  private async reviewIteration(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: ReviewIterationPayload,
  ): Promise<CommandResult> {
    this.requireCoordinator(actor)
    const iteration = (await this.getProjectSnapshot(command.projectId)).iterations[payload.review.iterationId]
    invariant(iteration, 'iteration_not_found', 'Iteration not found')
    invariant(iteration.status === 'reported', 'result_not_ready', 'Iteration is not awaiting review')
    const result = await this.deps.recordStore.readResult(command.projectId, iteration.id)
    invariant(result, 'result_not_found', 'Worker result not found')
    const existing = await this.deps.recordStore.readReview(command.projectId, iteration.id)
    if (existing) return { ok: true, commandId: command.id, eventIds: [], recordId: existing.id }
    const unsigned = {
      ...payload.review,
      schemaVersion: 1 as const,
      id: this.deps.ids.next(),
      coordinatorAgentId: actor.agentId,
      createdAt: this.deps.clock.now(),
    }
    const review: IterationReviewV1 = { ...unsigned, digest: await this.deps.digests.digest(unsigned) }
    await this.deps.recordStore.writeReview(review)
    const type = review.decision === 'accept'
      ? 'iteration.accepted'
      : review.decision === 'revise'
        ? 'iteration.revision_requested'
        : review.decision === 'cancel'
          ? 'iteration.cancelled'
          : 'iteration.failed'
    const events = await this.commit(command.projectId, this.correlate(command, [{
      type,
      actor: actorFromCommand(actor),
      taskId: iteration.taskId,
      iterationId: iteration.id,
      payload: { reviewId: review.id, reviewDigest: review.digest, summary: review.summary },
    }]))
    await this.deps.taskProjection.changeStatus(
      iteration.taskId,
      review.decision === 'accept'
        ? 'completed'
        : review.decision === 'revise'
          ? 'running'
          : review.decision === 'cancel'
            ? 'cancelled'
            : 'blocked',
      review.decision === 'accept' ? { acceptedIterationId: iteration.id } : undefined,
    )
    await this.deps.assignmentStore.clear(iteration.workerAgentId, iteration.id)
    const worker = await this.deps.agents.get(iteration.workerAgentId)
    await this.appendMessage(actor, {
      message: {
        role: 'project-channel',
        recipients: worker ? [{ kind: 'worker', id: worker.id, displayName: worker.name }] : [],
        kind: 'review',
        text: review.summary,
        taskId: iteration.taskId,
        iterationId: iteration.id,
      },
    })
    const snapshot = await this.getProjectSnapshot(command.projectId)
    const terminalTasks = snapshot.taskIds.every((taskId) =>
      snapshot.taskStatuses[taskId] === 'completed' ||
      snapshot.taskStatuses[taskId] === 'cancelled')
    if (
      terminalTasks &&
      snapshot.activeIterationIds.length === 0 &&
      snapshot.unresolvedQuestionIds.length === 0
    ) {
      const completed = await this.commit(command.projectId, this.correlate(command, [{
        type: 'project.completed',
        actor: actorFromCommand(actor),
        payload: { summary: review.summary },
      }]))
      events.push(...completed)
      await this.appendMessage(actor, {
        message: {
          role: 'project-channel',
          recipients: [],
          kind: 'status',
          text: `Project complete. ${review.summary}`,
        },
      })
    }
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id), recordId: review.id }
  }

  private async sendMessage(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: SendMessagePayload,
  ): Promise<CommandResult> {
    const policy = await this.policy(command.projectId)
    const before = await this.getProjectSnapshot(command.projectId)
    if (payload.message.kind === 'question') {
      invariant(
        before.unresolvedQuestionIds.length < policy.communication.maxUnresolvedThreadMessages,
        'message_thread_limit',
        'Too many project questions are unresolved; escalate before opening another thread',
      )
    }
    const message = await this.appendMessage(actor, payload)
    const events = await this.commit(command.projectId, this.correlate(command, [{
      type: message.kind === 'question' ? 'iteration.questioned' : 'message.sent',
      actor: actorFromCommand(actor),
      taskId: message.taskId,
      iterationId: message.iterationId,
      messageId: message.id,
      payload: {
        kind: message.kind,
        recipientIds: message.recipients.map((item) => item.id),
        blocksWork: payload.blocksWork === true,
        replyToMessageId: message.replyToMessageId,
      },
    }]))
    for (const recipient of message.recipients) {
      if (recipient.kind === 'user' || recipient.kind === 'system') continue
      await this.deps.wakeQueue.enqueue({
        id: `${events[0]!.id}:${recipient.id}`,
        agentId: recipient.id,
        reason: message.kind === 'question' && recipient.kind === 'project-agent'
          ? 'worker_question'
          : 'agent_message',
        projectId: command.projectId,
        taskId: message.taskId,
        iterationId: message.iterationId,
        messageId: message.id,
      })
    }
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id), recordId: message.id }
  }

  private async appendMessage(
    actor: CommandActor,
    payload: SendMessagePayload,
  ): Promise<ProjectChannelMessage> {
    invariant(payload.message.text?.trim(), 'invalid_message', 'Message text is required')
    const policy = await this.policy(actor.projectId)
    const memberIds = new Set((await this.deps.agents.list(actor.projectId)).map((item) => item.id))
    for (const recipient of payload.message.recipients) {
      invariant(memberIds.has(recipient.id), 'invalid_recipient', 'Message recipient is not assigned to the project')
      if (actor.role === 'worker' && recipient.kind === 'worker') {
        invariant(policy.communication.allowWorkerToWorker, 'worker_messaging_disabled', 'Worker-to-worker messages are disabled')
      }
    }
    const message: ProjectChannelMessage = {
      ...payload.message,
      schemaVersion: 2,
      id: this.deps.ids.next(),
      timestamp: this.deps.clock.now(),
      projectId: actor.projectId,
      actor: actorFromCommand(actor),
      text: payload.message.text.trim(),
    }
    await this.deps.conversationStore.append([message])
    this.deps.notifier.projectChatChanged(actor.projectId, [message.id])
    return message
  }

  private async requestUserDecision(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: UserDecisionPayload,
  ): Promise<CommandResult> {
    this.requireCoordinator(actor)
    invariant(payload.question?.trim(), 'invalid_question', 'Question is required')
    const message: ProjectChannelMessage = {
      schemaVersion: 2,
      id: this.deps.ids.next(),
      role: 'project-channel',
      timestamp: this.deps.clock.now(),
      projectId: command.projectId,
      actor: actorFromCommand(actor),
      recipients: [userActor],
      kind: 'question',
      text: payload.question.trim(),
      taskId: payload.taskId,
      iterationId: payload.iterationId,
      questionThreadId: this.deps.ids.next(),
    }
    await this.deps.conversationStore.append([message])
    this.deps.notifier.projectChatChanged(command.projectId, [message.id])
    const events = await this.commit(command.projectId, this.correlate(command, [{
      type: 'user_decision.requested',
      actor: actorFromCommand(actor),
      taskId: payload.taskId,
      iterationId: payload.iterationId,
      messageId: message.id,
      payload: { blocksProject: payload.blocksProject },
    }]))
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id), recordId: message.id }
  }

  private async resolveUserDecision(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: { messageId: string },
  ): Promise<CommandResult> {
    this.requireCoordinator(actor)
    invariant(payload.messageId, 'invalid_message_id', 'Decision message ID is required')
    const events = await this.commit(command.projectId, this.correlate(command, [{
      type: 'user_decision.resolved',
      actor: actorFromCommand(actor),
      messageId: payload.messageId,
      payload: {},
    }]))
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id) }
  }

  private async updateProjectStatus(
    command: OrchestrationCommandEnvelope,
    actor: CommandActor,
    payload: UpdateProjectStatusPayload,
  ): Promise<CommandResult> {
    this.requireCoordinator(actor)
    invariant(payload.summary?.trim(), 'invalid_summary', 'Project status summary is required')
    if (payload.progress !== undefined) {
      invariant(payload.progress >= 0 && payload.progress <= 100, 'invalid_progress', 'Progress must be between 0 and 100')
    }
    const events = await this.commit(command.projectId, this.correlate(command, [{
      type: 'project.status_changed',
      actor: actorFromCommand(actor),
      payload: {
        summary: payload.summary.trim(),
        phase: payload.phase,
        progress: payload.progress,
      },
    }]))
    return { ok: true, commandId: command.id, eventIds: events.map((event) => event.id) }
  }

  private async commit(
    projectId: string,
    pending: UncommittedProjectEvent[],
  ): Promise<ProjectEventV1[]> {
    const committed = await this.deps.eventStore.append(projectId, pending)
    let snapshot = await this.getProjectSnapshot(projectId)
    for (const event of committed) snapshot = this.reducers.reduce(snapshot, event)
    await this.deps.snapshotStore.write(snapshot)
    this.deps.notifier.projectChanged(snapshot)
    for (const worker of Object.values(snapshot.workers)) {
      this.deps.notifier.agentChanged(worker)
    }
    return committed
  }
}

function assertAcyclic(tasks: Array<{ key: string; dependencies: string[] }>): void {
  const graph = new Map(tasks.map((task) => [task.key, task.dependencies]))
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (key: string): void => {
    if (visited.has(key)) return
    invariant(!visiting.has(key), 'dependency_cycle', `Task dependency cycle includes ${key}`)
    visiting.add(key)
    for (const dependency of graph.get(key) ?? []) visit(dependency)
    visiting.delete(key)
    visited.add(key)
  }
  for (const task of tasks) visit(task.key)
}
