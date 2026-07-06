import type { Agent, AgentStatus, Project } from '@/storage/types'

export type { Agent, AgentStatus, Project } from '@/storage/types'

export type { InitStep, AdapterEvent } from '../../electron/pi-protocol/types'

export interface RuntimeMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface RuntimeStatusPayload {
  agentId: string
  status: AgentStatus
  pid?: number
  startedAt?: number
  endedAt?: number
  lastError?: string
  bootStep?: InitStep
}

export interface RuntimeExitPayload {
  agentId: string
  code: number | null
  signal: string | null
  status: AgentStatus
}

export interface AgentCreateInput {
  name: string
  folderName: string
  parentDir: string
  manifestPiSource: string
  role?: string
  description?: string
}

export interface AgentsAPI {
  list: () => Promise<Agent[]>
  get: (id: string) => Promise<Agent | null>
  create: (data: AgentCreateInput) => Promise<Agent>
  delete: (id: string) => Promise<boolean>
  updateStatus: (id: string, status: AgentStatus, lastError?: string) => Promise<Agent | undefined>

  start: (id: string) => Promise<{ ok: boolean }>
  stop: (id: string) => Promise<{ ok: boolean }>
  restart: (id: string) => Promise<{ ok: boolean }>
  send: (id: string, message: string) => Promise<{ ok: boolean }>
  getRuntimeState: (id: string) => Promise<RuntimeStatusPayload | null>

  onEvent:    (id: string, cb: (event: AdapterEvent) => void) => () => void
  onStatus:   (id: string, cb: (status: RuntimeStatusPayload) => void) => () => void
  onMessages: (id: string, cb: (messages: RuntimeMessage[]) => void) => () => void
  onExit:     (id: string, cb: (payload: RuntimeExitPayload) => void) => () => void
}

export interface ProjectsAPI {
  list: () => Promise<Project[]>
  get: (id: string) => Promise<Project | null>
  create: (data: ProjectCreateInput) => Promise<Project>
}

export type ProjectCreateInput = {
  name: string
  description?: string
}

export type EnsureTemplateResult =
  | { ok: true; path: string; cloned: boolean }
  | { ok: false; path: string; error: string }

export interface ManifestPiAPI {
  ensureTemplate: () => Promise<EnsureTemplateResult>
  checkTemplate: () => Promise<{ ok: boolean; path: string }>
}

export interface ElectronAPI {
  agents: AgentsAPI
  projects: ProjectsAPI
  manifestPi: ManifestPiAPI
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export {}