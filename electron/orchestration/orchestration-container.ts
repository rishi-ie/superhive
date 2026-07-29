import { readFile } from 'node:fs/promises'
import { OrchestrationService, RecoveryService } from '../../src/orchestration/application'
import type { ProjectOrchestrationPolicyOverride } from '../../src/orchestration/domain/policies'
import { systemClock } from '../../src/orchestration/ports/clock'
import { cryptoIdGenerator } from '../../src/orchestration/ports/id-generator'
import { InMemoryWorkerProfileRegistry } from '../../src/orchestration/ports'
import { generalWorkerProfile } from '../../src/orchestration/domain/worker-profiles'
import { ProjectRepository } from '../../src/storage/repositories/ProjectRepository'
import { OrchestrationCommandOutboxWatcher } from './command-outbox-watcher'
import { ElectronOrchestrationNotifier } from './electron-notifier'
import { FilesystemProjectConversationStore } from './filesystem-conversation-store'
import { FilesystemWorkerAssignmentStore } from './filesystem-assignment-store'
import { FilesystemProjectContextProvider } from './filesystem-context-provider'
import { FilesystemProjectEventStore } from './filesystem-event-store'
import { FilesystemOrchestrationLayout } from './filesystem-layout'
import { FilesystemOrchestrationRecordStore } from './filesystem-record-store'
import { FilesystemProjectSnapshotStore } from './filesystem-snapshot-store'
import { RuntimeInternalWakeQueue } from './internal-wake-queue'
import { LowdbTaskProjection } from './lowdb-task-projection'
import { NodeDigestService } from './node-digest-service'
import { PiRuntimeGateway } from './pi-runtime-gateway'
import {
  RepositoryProjectAgentDirectory,
  RepositoryProjectDirectory,
} from './repository-directories'

const projects = new RepositoryProjectDirectory()
const agents = new RepositoryProjectAgentDirectory()
const layout = new FilesystemOrchestrationLayout(projects)
const digests = new NodeDigestService()
const runtimeGateway = new PiRuntimeGateway()
const wakeQueue = new RuntimeInternalWakeQueue(runtimeGateway)
const eventStore = new FilesystemProjectEventStore(layout, systemClock, cryptoIdGenerator, digests)
const snapshotStore = new FilesystemProjectSnapshotStore(layout)
const recordStore = new FilesystemOrchestrationRecordStore(layout)
const conversationStore = new FilesystemProjectConversationStore(layout)
const notifier = new ElectronOrchestrationNotifier()
const assignmentStore = new FilesystemWorkerAssignmentStore(agents)
const contextProvider = new FilesystemProjectContextProvider(agents)
const workerProfiles = new InMemoryWorkerProfileRegistry()
workerProfiles.register(generalWorkerProfile)

export const orchestrationService = new OrchestrationService({
  eventStore,
  snapshotStore,
  recordStore,
  conversationStore,
  taskProjection: new LowdbTaskProjection(),
  runtimeGateway,
  wakeQueue,
  clock: systemClock,
  ids: cryptoIdGenerator,
  digests,
  notifier,
  agents,
  assignmentStore,
  contextProvider,
  workerProfiles,
  readPolicyOverride: async (projectId): Promise<ProjectOrchestrationPolicyOverride> => {
    try {
      return JSON.parse(await readFile(await layout.policy(projectId), 'utf8')) as ProjectOrchestrationPolicyOverride
    } catch {
      return {}
    }
  },
})

export const orchestrationRecovery = new RecoveryService({
  eventStore,
  snapshotStore,
  recordStore,
  conversationStore,
  taskProjection: new LowdbTaskProjection(),
  runtimeGateway,
  wakeQueue,
  clock: systemClock,
  ids: cryptoIdGenerator,
  digests,
  notifier,
  agents,
  assignmentStore,
  contextProvider,
  workerProfiles,
})

export const orchestrationOutboxWatcher = new OrchestrationCommandOutboxWatcher(
  orchestrationService,
  agents,
  async () => (await ProjectRepository.getAll()).map((project) => project.id),
  wakeQueue,
)

export const orchestrationStores = { eventStore, snapshotStore, recordStore, conversationStore }

export async function recoverOrchestrationProjects(): Promise<void> {
  for (const project of await ProjectRepository.getAll()) {
    await orchestrationService.rebuildProjectSnapshot(project.id)
    await orchestrationRecovery.recoverProject(project.id)
  }
}
