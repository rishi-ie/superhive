import type {
  Agent,
  AgentStatus,
  AgentCreateInput,
  Project,
  RuntimeStatusPayload,
  RuntimeExitPayload,
  AdapterEvent,
} from '@/types/electron'
import type { AssistantMessage, ChatRow } from '@/models/assistant-message'

export const agents = {
  list: (): Promise<Agent[]> => window.api.agents.list(),
  get: (id: string): Promise<Agent | null> => window.api.agents.get(id),
  create: (data: AgentCreateInput): Promise<Agent> => window.api.agents.create(data),
  delete: (id: string): Promise<boolean> => window.api.agents.delete(id),
  updateStatus: (id: string, status: AgentStatus, lastError?: string): Promise<Agent | undefined> =>
    window.api.agents.updateStatus(id, status, lastError),

  start: (id: string): Promise<{ ok: boolean }> => window.api.agents.start(id),
  stop: (id: string): Promise<{ ok: boolean }> => window.api.agents.stop(id),
  restart: (id: string): Promise<{ ok: boolean }> => window.api.agents.restart(id),
  send: (id: string, message: string): Promise<{ ok: boolean }> => window.api.agents.send(id, message),
  getRuntimeState: (id: string): Promise<RuntimeStatusPayload | null> =>
    window.api.agents.getRuntimeState(id),
  getProjects: (id: string): Promise<Project[]> => window.api.agents.getProjects(id),
  getMessages: (id: string): Promise<ChatRow[]> => window.api.agents.getMessages(id),

  readSettings: (id: string): Promise<Record<string, unknown> | null> =>
    window.api.agents.readSettings(id),
  writeSettings: (id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> =>
    window.api.agents.writeSettings(id, patch),
  readManage: (id: string): Promise<Record<string, unknown> | null> =>
    window.api.agents.readManage(id),
  writeManage: (
    id: string,
    patch: Record<string, unknown>,
  ): Promise<{ ok: boolean; writtenVersion: number }> =>
    window.api.agents.writeManage(id, patch),
  readOverview: (id: string): Promise<Record<string, unknown> | null> =>
    window.api.agents.readOverview(id),
  writeOverview: (
    id: string,
    patch: Record<string, unknown>,
  ): Promise<{ ok: boolean; writtenVersion: number }> =>
    window.api.agents.writeOverview(id, patch),
  readInboxJson: (id: string): Promise<{ items: unknown[] } | null> =>
    window.api.agents.readInbox(id),
  appendInbox: (
    id: string,
    input: { kind: 'notification' | 'permission' | 'question'; message: string; severity?: 'info' | 'warning' | 'error'; payload?: Record<string, unknown> },
  ): Promise<{ ok: boolean; id: string; writtenVersion: number }> =>
    window.api.agents.appendInbox(id, input),
  markInboxRead: (
    id: string,
    inboxId: string,
    answeredWith?: unknown,
  ): Promise<{ ok: boolean }> =>
    window.api.agents.markInboxRead(id, inboxId, answeredWith),
  clearInbox: (
    id: string,
    status?: 'pending' | 'read' | 'answered' | 'dismissed',
  ): Promise<{ ok: boolean; removed: number }> =>
    window.api.agents.clearInbox(id, status),
  reveal: (id: string): Promise<{ ok: boolean }> =>
    window.api.agents.reveal(id),
  persistAssistantMessage: (
    id: string,
    message: AssistantMessage,
  ): Promise<{ ok: boolean }> =>
    window.api.agents.persistAssistantMessage(id, message),

  onEvent:    (id: string, cb: (event: AdapterEvent) => void): (() => void) => window.api.agents.onEvent(id, cb),
  onStatus:   (id: string, cb: (status: RuntimeStatusPayload) => void): (() => void) => window.api.agents.onStatus(id, cb),
  onMessages: (id: string, cb: (messages: ChatRow[]) => void): (() => void) => window.api.agents.onMessages(id, cb),
  onExit:     (id: string, cb: (payload: RuntimeExitPayload) => void): (() => void) => window.api.agents.onExit(id, cb),
  onSettingsChanged: (id: string, cb: (agentId: string) => void): (() => void) =>
    window.api.agents.onSettingsChanged(id, cb),
  onCreated: (id: string, cb: (info: { defaultModel: string | null }) => void): (() => void) =>
    window.api.agents.onCreated(id, cb),

  onChanged: (cb: () => void): (() => void) => window.api.agents.onChanged(cb),
}
