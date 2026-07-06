import type {
  Agent,
  AgentStatus,
  AgentCreateInput,
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

  onEvent:    (id: string, cb: (event: AdapterEvent) => void): (() => void) => window.api.agents.onEvent(id, cb),
  onStatus:   (id: string, cb: (status: RuntimeStatusPayload) => void): (() => void) => window.api.agents.onStatus(id, cb),
  onMessages: (id: string, cb: (messages: RuntimeMessage[]) => void): (() => void) => window.api.agents.onMessages(id, cb),
  onExit:     (id: string, cb: (payload: RuntimeExitPayload) => void): (() => void) => window.api.agents.onExit(id, cb),
}