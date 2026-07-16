import type {
  Agent,
  AgentStatus,
  AgentCreateInput,
  AgentForkInput,
  Project,
  RuntimeMessage,
  RuntimeStatusPayload,
  RuntimeExitPayload,
  AdapterEvent,
} from '@/types/electron'

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
  getMessages: (id: string): Promise<RuntimeMessage[]> => window.api.agents.getMessages(id),
  editMessage: (id: string, messageId: string, text: string): Promise<{ ok: boolean }> =>
    window.api.agents.editMessage(id, messageId, text),
  regenerate: (id: string, fromMessageId: string): Promise<{ ok: boolean }> =>
    window.api.agents.regenerate(id, fromMessageId),
  deleteMessage: (id: string, messageId: string): Promise<{ ok: boolean }> =>
    window.api.agents.deleteMessage(id, messageId),

  readSettings: (id: string): Promise<Record<string, unknown> | null> =>
    window.api.agents.readSettings(id),
  writeSettings: (id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> =>
    window.api.agents.writeSettings(id, patch),
  reveal: (id: string): Promise<{ ok: boolean }> => window.api.agents.reveal(id),
  forkFromSettings: (sourceAgentId: string, data: AgentForkInput): Promise<Agent> =>
    window.api.agents.forkFromSettings(sourceAgentId, data),

  onEvent:    (id: string, cb: (event: AdapterEvent) => void): (() => void) => window.api.agents.onEvent(id, cb),
  onStatus:   (id: string, cb: (status: RuntimeStatusPayload) => void): (() => void) => window.api.agents.onStatus(id, cb),
  onMessages: (id: string, cb: (messages: RuntimeMessage[]) => void): (() => void) => window.api.agents.onMessages(id, cb),
  onExit:     (id: string, cb: (payload: RuntimeExitPayload) => void): (() => void) => window.api.agents.onExit(id, cb),
  onSettingsChanged: (id: string, cb: (agentId: string) => void): (() => void) =>
    window.api.agents.onSettingsChanged(id, cb),
  onCreated: (id: string, cb: (info: { defaultModel: string | null }) => void): (() => void) =>
    window.api.agents.onCreated(id, cb),
}