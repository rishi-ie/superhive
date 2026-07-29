import { OrchestrationService, type OrchestrationDependencies } from '../application'
import type {
  IterationReviewV1,
  LoopIterationV1,
  ProjectChannelMessage,
  ProjectExecutionSnapshot,
  ProjectMessageReceipt,
  ProjectPlanTaskV1,
  ProjectPlanV1,
  WorkPacketV2,
  WorkerResultV1,
} from '../domain/entities'
import type {
  OrchestrationNotifier,
  OrchestrationRecordStore,
  ProjectAgentDirectory,
  ProjectAgentRecord,
  ProjectConversationStore,
  ProjectSnapshotStore,
  ProjectTaskProjection,
  TaskProjection,
  WorkerAssignmentStore,
} from '../ports'
import { DeterministicClock } from './deterministic-clock'
import { DeterministicIdGenerator } from './deterministic-id-generator'
import { FakeRuntimeGateway } from './fake-runtime-gateway'
import { FakeWakeQueue } from './fake-wake-queue'
import { InMemoryProjectEventStore } from './in-memory-event-store'
import { InMemoryWorkerProfileRegistry } from '../ports'
import { generalWorkerProfile } from '../domain/worker-profiles'

class MemorySnapshots implements ProjectSnapshotStore {
  readonly rows = new Map<string, ProjectExecutionSnapshot>()
  async read(projectId: string) { return this.rows.get(projectId) ?? null }
  async write(snapshot: ProjectExecutionSnapshot) { this.rows.set(snapshot.projectId, structuredClone(snapshot)) }
}

class MemoryRecords implements OrchestrationRecordStore {
  readonly plans = new Map<string, ProjectPlanV1>()
  readonly iterations = new Map<string, LoopIterationV1>()
  readonly packets = new Map<string, WorkPacketV2>()
  readonly results = new Map<string, WorkerResultV1>()
  readonly reviews = new Map<string, IterationReviewV1>()
  async writePlan(value: ProjectPlanV1) { this.plans.set(value.id, structuredClone(value)) }
  async readPlan(_projectId: string, id: string) { return this.plans.get(id) ?? null }
  async listPlans(projectId: string) { return [...this.plans.values()].filter((row) => row.projectId === projectId) }
  async writeIteration(value: LoopIterationV1) { this.iterations.set(value.id, structuredClone(value)) }
  async readIteration(_projectId: string, id: string) { return this.iterations.get(id) ?? null }
  async writePacket(value: WorkPacketV2) { this.packets.set(value.iterationId, structuredClone(value)) }
  async readPacket(_projectId: string, id: string) { return this.packets.get(id) ?? null }
  async writeResult(value: WorkerResultV1) { this.results.set(value.iterationId, structuredClone(value)) }
  async readResult(_projectId: string, id: string) { return this.results.get(id) ?? null }
  async writeReview(value: IterationReviewV1) { this.reviews.set(value.iterationId, structuredClone(value)) }
  async readReview(_projectId: string, id: string) { return this.reviews.get(id) ?? null }
}

class MemoryConversation implements ProjectConversationStore {
  readonly messages: ProjectChannelMessage[] = []
  readonly receipts: ProjectMessageReceipt[] = []
  async append(messages: ProjectChannelMessage[]) { this.messages.push(...structuredClone(messages)) }
  async list(projectId: string) { return { messages: this.messages.filter((row) => row.projectId === projectId) } }
  async appendReceipt(receipt: ProjectMessageReceipt) { this.receipts.push(structuredClone(receipt)) }
}

class MemoryTasks implements TaskProjection {
  readonly rows = new Map<string, ProjectTaskProjection>()
  constructor(private readonly ids: DeterministicIdGenerator) {}
  async createPlanTasks(
    projectId: string,
    planId: string,
    input: Array<Omit<ProjectPlanTaskV1, 'id'>>,
  ): Promise<ProjectPlanTaskV1[]> {
    const idByKey = new Map(input.map((task) => [task.key, this.ids.next()]))
    const tasks = input.map((task) => ({
      ...task,
      id: idByKey.get(task.key)!,
      dependencies: task.dependencies.map((key) => idByKey.get(key)!),
    }))
    for (const task of tasks) {
      this.rows.set(task.id, {
        id: task.id,
        projectId,
        planId,
        status: 'todo',
        dependencies: task.dependencies,
        iterationCount: 0,
      })
    }
    return tasks
  }
  async get(id: string) { return this.rows.get(id) ?? null }
  async list(projectId: string) { return [...this.rows.values()].filter((row) => row.projectId === projectId) }
  async assignIteration(taskId: string, assignedAgentId: string, currentIterationId: string) {
    const task = this.rows.get(taskId)
    if (!task) return
    this.rows.set(taskId, {
      ...task,
      assignedAgentId,
      currentIterationId,
      iterationCount: task.iterationCount + 1,
      status: 'running',
    })
  }
  async changeStatus(id: string, status: ProjectTaskProjection['status'], patch = {}) {
    const task = this.rows.get(id)
    if (task) this.rows.set(id, { ...task, ...patch, status })
  }
}

class MemoryAgents implements ProjectAgentDirectory {
  readonly rows: ProjectAgentRecord[] = [
    { id: 'coord', name: 'Project Agent', role: 'coordinator', projectId: 'project', localPath: '/coord' },
    { id: 'worker-1', name: 'Worker One', role: 'worker', projectId: 'project', localPath: '/worker-1', workerProfileId: 'general-worker' },
    { id: 'worker-2', name: 'Worker Two', role: 'worker', projectId: 'project', localPath: '/worker-2', workerProfileId: 'general-worker' },
  ]
  async get(id: string) { return this.rows.find((row) => row.id === id) ?? null }
  async list(projectId: string) { return this.rows.filter((row) => row.projectId === projectId) }
  async coordinator(projectId: string) { return this.rows.find((row) => row.projectId === projectId && row.role === 'coordinator') ?? null }
}

class MemoryNotifier implements OrchestrationNotifier {
  readonly projects: ProjectExecutionSnapshot[] = []
  readonly chats: Array<{ projectId: string; messageIds: string[] }> = []
  projectChanged(snapshot: ProjectExecutionSnapshot) { this.projects.push(structuredClone(snapshot)) }
  projectChatChanged(projectId: string, messageIds: string[]) { this.chats.push({ projectId, messageIds }) }
  agentChanged() {}
}

class MemoryAssignments implements WorkerAssignmentStore {
  readonly rows = new Map<string, WorkPacketV2>()
  async write(packet: WorkPacketV2) { this.rows.set(packet.workerAgentId, structuredClone(packet)) }
  async clear(workerAgentId: string, iterationId: string) {
    if (this.rows.get(workerAgentId)?.iterationId === iterationId) this.rows.delete(workerAgentId)
  }
}

export function createOrchestrationScenario() {
  const clock = new DeterministicClock()
  const ids = new DeterministicIdGenerator()
  const digests = { digest: async (value: unknown) => JSON.stringify(value) }
  const eventStore = new InMemoryProjectEventStore(clock, ids, digests)
  const snapshotStore = new MemorySnapshots()
  const recordStore = new MemoryRecords()
  const conversationStore = new MemoryConversation()
  const taskProjection = new MemoryTasks(ids)
  const runtimeGateway = new FakeRuntimeGateway()
  const wakeQueue = new FakeWakeQueue()
  const notifier = new MemoryNotifier()
  const agents = new MemoryAgents()
  const assignmentStore = new MemoryAssignments()
  const workerProfiles = new InMemoryWorkerProfileRegistry()
  workerProfiles.register(generalWorkerProfile)
  const dependencies: OrchestrationDependencies = {
    eventStore,
    snapshotStore,
    recordStore,
    conversationStore,
    taskProjection,
    runtimeGateway,
    wakeQueue,
    clock,
    ids,
    digests,
    notifier,
    agents,
    assignmentStore,
    workerProfiles,
  }
  return {
    service: new OrchestrationService(dependencies),
    dependencies,
    eventStore,
    snapshotStore,
    recordStore,
    conversationStore,
    taskProjection,
    runtimeGateway,
    wakeQueue,
    notifier,
    agents,
    assignmentStore,
  }
}
