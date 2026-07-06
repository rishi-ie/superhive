import type { Agent, AgentStatus, Project } from '@/storage/types'
import type { RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload } from '@/models/runtime'
import type { InitStep, AdapterEvent } from '@/models/boot-step'
import type { EnsureTemplateResult } from '@/models/template'

export type { Agent, AgentStatus, Project }

export type { RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload }
export type { InitStep, AdapterEvent }
export type { EnsureTemplateResult }

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
  readSettings: (id: string) => Promise<Record<string, unknown> | null>
  writeSettings: (id: string, patch: Record<string, unknown>) => Promise<Record<string, unknown>>

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
