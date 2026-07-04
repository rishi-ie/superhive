import type { Agent, AgentStatus } from '@/storage/types'

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

export interface ElectronAPI {
  agents: AgentsAPI
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}

export {}
