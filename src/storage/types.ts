export type AgentStatus = 'idle' | 'active' | 'busy' | 'waiting'

export type AgentKind = 'standard' | 'project-coordinator'

export type SettingType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json' | 'color' | 'slider' | 'file' | 'directory'
export type OwnerType = 'workspace' | 'project' | 'agent' | 'task' | 'channel' | 'global'

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
  parentProjectId?: string
  childProjectIds: string[]
}

export interface Workspace extends BaseEntity {
  name: string
}

export type TaskStatus = 'todo' | 'running' | 'blocked' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Task extends BaseEntity {
  title: string
  description?: string
  projectId: string
  assignedAgentId?: string
  status: TaskStatus
  priority: TaskPriority
  context?: string
  tagIds: string[]
  // Gap 3: dependency graph + runner state
  dependencies: string[]          // taskIds that must be 'completed' before this is ready
  blockerReason?: string          // when status='blocked'
  staleSince?: number             // epoch ms; runner-managed, used for auto-retry
  outcome?: string                // final summary set by complete_task
}

export interface Session extends BaseEntity {
  name: string
  agentId: string
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
  agents: Agent[]
  projects: Project[]
  workspaces: Workspace[]
}

export const createDefaultDatabase = (): Database => ({
  agents: [],
  projects: [],
  workspaces: [],
})
