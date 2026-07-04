import type { Agent, AgentStatus } from '@/storage/types'
import type { Project } from '@/storage/types'

export interface AgentsAPI {
  list: () => Promise<Agent[]>
  get: (id: string) => Promise<Agent | null>
  create: (data: AgentCreateInput) => Promise<Agent>
}

export type AgentCreateInput = {
  name: string
  role?: string
  status?: AgentStatus
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

export interface ElectronAPI {
  agents: AgentsAPI
  projects: ProjectsAPI
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export {}
