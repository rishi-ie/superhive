export type AgentStatus =
  | 'initializing'
  | 'running'
  | 'busy'
  | 'idle'
  | 'stopped'
  | 'error'

export type AgentKind = 'standard' | 'project-coordinator'

export type ChannelType = 'project' | 'agent' | 'system'

export interface BaseEntity {
  id: string
  createdAt: number
  updatedAt: number
}

export interface Agent extends BaseEntity {
  name: string
  role?: string
  description?: string
  localPath?: string
  avatar?: string
  status: AgentStatus
  lastError?: string
  projectIds: string[]
  taskIds: string[]
  sessionIds: string[]
  agentKind?: AgentKind
}

export interface Project extends BaseEntity {
  name: string
  description?: string
  localPath?: string
  okfFolderPath?: string
  color?: string
  icon?: string
  archived: boolean
  agentIds: string[]
  taskIds: string[]
  channelIds: string[]
  channelId?: string
  parentProjectId?: string
  childProjectIds: string[]
}

export interface Channel extends BaseEntity {
  name: string
  type: ChannelType
  projectId?: string
  participantAgentIds: string[]
  startedAt?: number
  endedAt?: number
  chatFile?: string
}

export interface Database {
  agents: Agent[]
  projects: Project[]
  channels: Channel[]
}

export const createDefaultDatabase = (): Database => ({
  agents: [],
  projects: [],
  channels: [],
})
