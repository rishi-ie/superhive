import type {
  Agent,
  AgentStatus,
  AgentCreateInput,
  Project,
  RuntimeMessage,
  RuntimeStatusPayload,
  RuntimeExitPayload,
  AdapterEvent,
} from '@/types/electron'
import type {
  ExtractAdapterEvent,
} from '@/types/adapter-event'

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

  onEvent:    (id: string, cb: (event: AdapterEvent) => void): (() => void) => window.api.agents.onEvent(id, cb),
  onStatus:   (id: string, cb: (status: RuntimeStatusPayload) => void): (() => void) => window.api.agents.onStatus(id, cb),
  onMessages: (id: string, cb: (messages: RuntimeMessage[]) => void): (() => void) => window.api.agents.onMessages(id, cb),
  onExit:     (id: string, cb: (payload: RuntimeExitPayload) => void): (() => void) => window.api.agents.onExit(id, cb),
  onSettingsChanged: (id: string, cb: (agentId: string) => void): (() => void) =>
    window.api.agents.onSettingsChanged(id, cb),
}

/**
 * Subscribe to a single `AdapterEvent` variant by `event.type`. Wraps the
 * generic `onEvent` channel and applies a runtime + compile-time type guard
 * so callers receive the narrowed variant. Returns the same unsubscribe
 * handle `onEvent` does.
 *
 * Usage: agents.onEventVariant(id, 'thinking-end', ev => { … })
 */
export function onEventVariant<T extends AdapterEvent['type']>(
  id: string,
  type: T,
  cb: (event: ExtractAdapterEvent<T>) => void,
): () => void {
  return agents.onEvent(id, (ev) => {
    if (ev.type === type) cb(ev as ExtractAdapterEvent<T>)
  })
}