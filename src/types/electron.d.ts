import type { Agent, AgentStatus, Project, Task, TaskStatus, TaskPriority } from '@/storage/types'
import type { RuntimeAssistantState, RuntimeStatusPayload, RuntimeExitPayload } from '@/models/runtime'
import type { InitStep, AdapterEvent, UsageSnapshot, ContextSnapshot, ModelInfo } from '@/models/runtime'
import type { AssistantMessage, ChatRow } from '@/models/assistant-message'

export type { Agent, AgentStatus, Project }
export type { Task, TaskStatus, TaskPriority }

export type { RuntimeAssistantState, RuntimeStatusPayload, RuntimeExitPayload }
export type { InitStep, AdapterEvent, UsageSnapshot, ContextSnapshot, ModelInfo }
export type { ChatRow, AssistantMessage }

export interface AgentCreateInput {
	name: string
	folderName: string
	parentDir: string
	role?: string
	description?: string
	agentKind?: string
	/**
	 * Gap 1: when creating a project-coordinator, pass the parent project's
	 * id so the seed truth settings file carries the `project` block.
	 */
	projectId?: string
	/**
	 * Phase A: when creating a project-coordinator, the bundled
	 * category overlay (research / marketing / sales / product-dev /
	 * project-dev / general) is merged into the seed manage.json.
	 * Ignored for non-coordinator agents. Falls back to 'general' if
	 * omitted or unknown.
	 */
	category?: string
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
	getMessages: (id: string) => Promise<ChatRow[]>
	readSettings: (id: string) => Promise<Record<string, unknown> | null>
	writeSettings: (id: string, patch: Record<string, unknown>) => Promise<Record<string, unknown>>
	/**
	 * 4-file truth split. Each channel reads or writes a single sibling
	 * file under <agentDir>/. truth migrates the legacy Superhive-pi-*.json
	 * on first launch; these channels always operate on the new layout.
	 */
	readManage: (id: string) => Promise<Record<string, unknown> | null>
	writeManage: (id: string, patch: Record<string, unknown>) => Promise<{ ok: boolean; writtenVersion: number }>
	readOverview: (id: string) => Promise<Record<string, unknown> | null>
	writeOverview: (id: string, patch: Record<string, unknown>) => Promise<{ ok: boolean; writtenVersion: number }>
	readInbox: (id: string) => Promise<{ items: unknown[] } | null>
	appendInbox: (id: string, input: { kind: 'notification' | 'permission' | 'question'; message: string; severity?: 'info' | 'warning' | 'error'; payload?: Record<string, unknown> }) => Promise<{ ok: boolean; id: string; writtenVersion: number }>
	markInboxRead: (id: string, inboxId: string, answeredWith?: unknown) => Promise<{ ok: boolean }>
	clearInbox: (id: string, status?: 'pending' | 'read' | 'answered' | 'dismissed') => Promise<{ ok: boolean; removed: number }>
	reveal: (id: string) => Promise<{ ok: boolean }>
	/**
	 * Renderer-driven assistant-message persistence. Fired on every
	 * `message-end` (or `set-frozen` from the 60s safety net, or
	 * `append-error`). Main process appends the row to chat.jsonl in
	 * one atomic write.
	 */
	persistAssistantMessage: (id: string, message: AssistantMessage) => Promise<{ ok: boolean }>

	/**
	 * Subscribe to all `AdapterEvent` variants for the agent. The full discriminated
	 * union flows through this single channel; consumers narrow on `event.type`.
	 *
	 * Forwarded event types include:
	 *   - Lifecycle: boot-step, ready, error, usage
	 *   - Message I/O: message-start, text-delta, message-end
	 *   - Thinking: thinking-start, thinking-delta, thinking-end
	 *   - Tool calls (assistant-side): tool-call-start, tool-call-delta, tool-call-end
	 *   - Tool execution (host-side): tool-execution-start, tool-execution-update, tool-execution-end
	 *   - Compaction: compaction-start, compaction-end
	 *   - Retry: auto-retry-start, auto-retry-end
	 *   - Attachments: image-attachment, branch-summary
	 *   - Diagnostics: log
	 */
	onEvent: (id: string, cb: (event: AdapterEvent) => void) => () => void
	onStatus: (id: string, cb: (status: RuntimeStatusPayload) => void) => () => void
	onMessages: (id: string, cb: (messages: ChatRow[]) => void) => () => void
	onExit: (id: string, cb: (payload: RuntimeExitPayload) => void) => () => void
	onSettingsChanged: (id: string, cb: (agentId: string) => void) => () => void
	onCreated: (id: string, cb: (info: { defaultModel: string | null }) => void) => () => void
	/**
	 * Subscribe to `agents:changed` IPC events. Broadcast by the main process
	 * after every reconcile pass — boot, every debounced fs event from the
	 * agents-fs-watcher, and every soft-delete eviction. Consumers re-fetch
	 * `list()` to pull the current state of `db.agents.json`.
	 */
	onChanged: (cb: () => void) => () => void
}

export interface ProjectsAPI {
  list: () => Promise<Project[]>
  get: (id: string) => Promise<Project | null>
  create: (data: ProjectCreateInput) => Promise<Project>
  update: (id: string, data: ProjectUpdateInput) => Promise<Project | null>
  delete: (id: string) => Promise<boolean>
  addAgent: (projectId: string, agentId: string) => Promise<void>
  removeAgent: (projectId: string, agentId: string) => Promise<void>
  reveal: (id: string) => Promise<{ ok: boolean }>
  /**
   * Subscribe to `projects:changed` IPC events. Broadcast by the main process
   * after every IPC handler that mutates `db.projects.json` — CREATE, UPDATE,
   * DELETE, ADD_AGENT, REMOVE_AGENT. Consumers re-fetch `list()` to pull the
   * current state without polling.
   */
  onChanged: (cb: () => void) => () => void
  /**
   * Subscribe to `projects:folder-missing` IPC events. Carries the list of
   * project rows that were hard-deleted because their folder vanished from
   * disk (Finder delete, move, unmounted drive). The toast hook consumes
   * this to surface one toast per deletion. Separate channel from
   * `projects:changed` so list re-fetch logic doesn't have to inspect
   * payloads.
   */
  onFolderMissing: (
    cb: (removed: Array<{ id: string; name: string }>) => void,
  ) => () => void
}

export type ProjectCreateInput = {
	name: string
	description?: string
	localPath?: string
}

export type ProjectUpdateInput = Partial<Pick<Project, 'name' | 'description' | 'localPath'>>

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
	settings: SettingsAPI
	tasks: TasksAPI
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
  contextWindow?: number
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
	getModels: () => Promise<ModelEntry[]>
	setModelEnabled: (id: string, enabled: boolean) => Promise<void>
	addModel: (input: { provider: string; name: string }) => Promise<void>
	deleteModel: (id: string) => Promise<void>
	getEnabledModels: () => Promise<Array<{ id: string; provider: string; name: string }>>
	/**
	 * Subscribe to `settings:model-updated` IPC events. Fired by the main
	 * process when a ModelEntry's contextWindow is auto-filled from
	 * superhive-pi-telemetry (Pi's model registry → HARDCODED_CONTEXT_WINDOWS
	 * fallback). Only emitted when the previous contextWindow was undefined.
	 */
	onModelUpdated: (cb: (update: { id: string; provider: string; name: string; contextWindow: number }) => void) => () => void
}

// Gap 3: task queue
export type TaskCreateInput = {
	title: string
	description?: string
	projectId: string
	assignedAgentId?: string
}

export type TaskUpdateInput = Partial<Pick<Task, 'title' | 'description' | 'assignedAgentId' | 'status' | 'priority' | 'dependencies' | 'outcome' | 'blockerReason'>>

export interface TaskFilter {
	projectId?: string
	agentId?: string
	status?: TaskStatus
}

export interface TasksAPI {
	list: (filter?: TaskFilter) => Promise<Task[]>
	get: (id: string) => Promise<Task | null>
	create: (data: TaskCreateInput) => Promise<Task>
	update: (id: string, patch: TaskUpdateInput) => Promise<Task | null>
	delete: (id: string) => Promise<boolean>
	assign: (taskId: string, agentId: string | null) => Promise<Task | null>
	changeStatus: (taskId: string, status: TaskStatus, outcome?: string) => Promise<Task | null>
	/**
	 * Subscribe to `tasks:changed` IPC events. Broadcast by the main
	 * process on every db.tasks.json write. Consumers re-fetch `list()`.
	 */
	onChanged: (cb: () => void) => () => void
}

declare global {
	interface Window {
		api: ElectronAPI
	}
}

export {}
