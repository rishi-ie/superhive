import type { Agent, AgentStatus, Project, Channel } from '@/storage/types'
import type { RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload } from '@/models/runtime'
import type { InitStep, AdapterEvent, UsageSnapshot, ContextSnapshot, ModelInfo } from '@/models/runtime'
import type { EnsureTemplateResult } from '@/models/template'

export type { Agent, AgentStatus, Project, Channel }

export type { RuntimeMessage, RuntimeStatusPayload, RuntimeExitPayload }
export type { InitStep, AdapterEvent, UsageSnapshot, ContextSnapshot, ModelInfo }
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
	getProjects: (id: string) => Promise<Project[]>
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
	removeAgent: (projectId: string, agentId: string) => Promise<void>
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
	settings: SettingsAPI
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

export interface ProviderEntry {
	name?: string
	baseUrl?: string | null
	apiKey?: string
	/** Master toggle on the API Keys block. Applies only to the preferred-model
	 *  row when one is configured. Independent of `apiKey` so the toggle can
	 *  persist after the key is cleared. */
	enabled?: boolean
	/** Model name typed into the API Keys block's "Model" field. Backed by a
	 *  single `models`-group row with `isCustom: true`. */
	preferredModel?: string
	/** AWS Bedrock only. */
	accessKeyId?: string
	secretAccessKey?: string
	region?: string
}

export interface ModelEntry {
	id: string
	provider: string
	name: string
	enabled: boolean
	isCustom?: boolean
}

export interface SetProviderInput {
	name: string
	baseUrl?: string
	apiKey?: string
	enabled?: boolean
	preferredModel?: string
	accessKeyId?: string
	secretAccessKey?: string
	region?: string
}

export interface SettingsAPI {
	getProviders: () => Promise<Record<string, ProviderEntry>>
	setProvider: (input: SetProviderInput) => Promise<void>
	deleteProvider: (name: string) => Promise<void>
	ensureProviderCatalog: (input: { provider: string; apiKeyIsFresh?: boolean }) => Promise<{ inserted: number }>
	getModels: () => Promise<ModelEntry[]>
	setModelEnabled: (id: string, enabled: boolean) => Promise<void>
	addModel: (input: { provider: string; name: string }) => Promise<void>
	deleteModel: (id: string) => Promise<void>
	getEnabledModels: () => Promise<Array<{ id: string; provider: string; name: string }>>
}

declare global {
	interface Window {
		api: ElectronAPI
	}
}

export {}
