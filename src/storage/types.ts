export type AgentStatus =
  | 'initializing'
  | 'running'
  | 'busy'
  | 'idle'
  | 'stopped'
  | 'error'

export type TaskStatus = 'todo' | 'running' | 'blocked' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type ChannelType = 'project' | 'agent' | 'system'
export type SettingType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json' | 'color' | 'slider' | 'file' | 'directory'
export type OwnerType = 'workspace' | 'project' | 'agent' | 'task' | 'channel' | 'global'

export interface BaseEntity {
  id: string
  createdAt: number
  updatedAt: number
}

export interface Workspace extends BaseEntity {
  name: string
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
  parentProjectId?: string
  childProjectIds: string[]
}

export interface Task extends BaseEntity {
  title: string
  description?: string
  projectId: string
  assignedAgentId?: string
  status: TaskStatus
  priority: TaskPriority
  context?: string
  tagIds: string[]
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

export interface Session extends BaseEntity {
  name: string
  agentId: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  createdAt: number
}

export interface Setting extends BaseEntity {
  ownerType: OwnerType
  ownerId: string
  key: string
  label?: string
  description?: string
  type: SettingType
  value?: unknown
  group?: string
  order: number
}

export interface Database {
  workspaces: Workspace[]
  agents: Agent[]
  projects: Project[]
  tasks: Task[]
  channels: Channel[]
  sessions: Session[]
  tags: Tag[]
  settings: Setting[]
}

export const createDefaultDatabase = (): Database => ({
  workspaces: [],
  agents: [],
  projects: [],
  tasks: [],
  channels: [],
  sessions: [],
  tags: [],
  settings: [],
})
