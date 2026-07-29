import { BrowserWindow } from 'electron'
import type {
  ProjectExecutionSnapshot,
  WorkerExecutionSnapshot,
} from '../../src/orchestration/domain/entities'
import type { OrchestrationNotifier } from '../../src/orchestration/ports'

export const ORCHESTRATION_CHANNELS = {
  PROJECT_CHANGED: (projectId: string) => `orchestration:project:${projectId}:changed`,
  CHAT_CHANGED: (projectId: string) => `orchestration:project:${projectId}:chat-changed`,
  AGENT_CHANGED: (agentId: string) => `orchestration:agent:${agentId}:changed`,
} as const

function broadcast(channel: string, payload: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }
}

export class ElectronOrchestrationNotifier implements OrchestrationNotifier {
  projectChanged(snapshot: ProjectExecutionSnapshot) {
    broadcast(ORCHESTRATION_CHANNELS.PROJECT_CHANGED(snapshot.projectId), snapshot)
  }
  projectChatChanged(projectId: string, messageIds: string[]) {
    broadcast(ORCHESTRATION_CHANNELS.CHAT_CHANGED(projectId), messageIds)
  }
  agentChanged(snapshot: WorkerExecutionSnapshot) {
    broadcast(ORCHESTRATION_CHANNELS.AGENT_CHANGED(snapshot.agentId), snapshot)
  }
}

