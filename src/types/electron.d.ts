import type { Agent, AgentStatus, Project, Channel } from '@/storage/types'
import type { RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload } from '@/models/runtime'
import type { InitStep, AdapterEvent } from '@/models/runtime'
import type { EnsureTemplateResult } from '@/models/template'

export type { Agent, AgentStatus, Project, Channel }

export type { RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload }
export type { InitStep, AdapterEvent }
export type { EnsureTemplateResult }

export interface AgentCreateInput {
	name: string
	folderName: string
	parentDir: string
	role?: string
	description?: string
	agentKind?: string
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

	onEvent: (id: string, cb: (event: AdapterEvent) => void) => () => void
	onStatus: (id: string, cb: (status: RuntimeStatusPayload) => void) => () => void
	onMessages: (id: string, cb: (messages: RuntimeMessage[]) => void) => () => void
	onExit: (id: string, cb: (payload: RuntimeExitPayload) => void) => () => void
	onSettingsChanged: (id: string, cb: (agentId: string) => void) => () => void
}

export interface ProjectsAPI {
	list: () => Promise<Project[]>
	get: (id: string) => Promise<Project | null>
	create: (data: ProjectCreateInput) => Promise<Project>
	update: (id: string, data: ProjectUpdateInput) => Promise<Project | null>
	delete: (id: string) => Promise<boolean>
	addAgent: (projectId: string, agentId: string) => Promise<void>
}

export type ProjectCreateInput = {
	name: string
	description?: string
	localPath?: string
}

export type ProjectUpdateInput = Partial<Pick<Project, 'name' | 'description' | 'localPath' | 'channelId'>>

export interface AppUpdateInfo {
	version: string
	releaseName?: string
}

export interface AppAPI {
	getVersion: () => Promise<string>
	onUpdateAvailable: (cb: (info: AppUpdateInfo) => void) => () => void
	onUpdateDownloaded: (cb: (info: AppUpdateInfo) => void) => () => void
	installUpdate: () => Promise<{ ok: boolean }>
}

export interface ElectronAPI {
	agents: AgentsAPI
	projects: ProjectsAPI
	app: AppAPI
	channels: ChannelsAPI
}

export interface ChannelMessage {
	id: string
	senderType: 'user' | 'agent' | 'system'
	senderId: string
	content: string
	timestamp: number
}

export interface CreateChannelInput {
	name: string
	type: 'project' | 'agent' | 'system'
	projectId?: string
	participantAgentIds: string[]
}

export interface ChannelsAPI {
	create(input: CreateChannelInput): Promise<Channel>
	get(id: string): Promise<Channel | null>
	list(): Promise<Channel[]>
	appendMessage(channelId: string, message: Omit<ChannelMessage, 'id' | 'timestamp'>): Promise<ChannelMessage>
	readMessages(channelId: string): Promise<ChannelMessage[]>
}

declare global {
	interface Window {
		api: ElectronAPI
	}
}

export {}
