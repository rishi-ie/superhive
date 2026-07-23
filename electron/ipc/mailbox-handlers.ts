/**
 * Pure Gap 2 mailbox handler functions.
 *
 * No electron, no ipcMain, no BrowserWindow. The IPC layer
 * (electron/ipc/mailbox.ts) wraps these in ipcMain.handle() and calls
 * them with the same arguments. Splitting this out lets the unit tests
 * import just the handlers without dragging in the electron module
 * (which can't load outside a real Electron process).
 *
 * Public surface:
 *   handlePostToProject(fromAgentId, input) — append a tagged entry to
 *     the project chat. Returns {ok, messageId} or {ok:false, error}.
 *   handleAskMember(fromAgentId, input) — append an entry to a member's
 *     inbox. Returns {ok, messageId} or {ok:false, error}.
 *   handleReadInbox(agentId, opts) — read the agent's effective inbox.
 *     Role-aware: coordinator reads the project chat; member reads
 *     their own inbox. Returns MailItem[].
 *   handleAckMessage(agentId, messageId) — flip pending → acked (member)
 *     or add agentId to deliveredTo[] (coordinator). Returns {ok}.
 *
 * Side effects:
 *   - Appends to <coordDir>/chat.jsonl or <memberDir>/inbox.jsonl
 *   - Writes MailEvent to <agentDir>/telemetry.jsonl
 *   - Calls broadcast functions passed at construction time (the IPC
 *     layer plugs these in to talk to BrowserWindow webContents)
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import log from 'electron-log/main'
import { AgentRepository } from '../../src/storage/repositories/AgentRepository'
import { manageFilePathFor } from '../agent-settings-defaults'
import {
	appendProjectChat,
	appendMemberInbox,
	readProjectChat,
	readMemberInbox,
	ackInboxMessage,
	markChatEntryDelivered,
	writeMailTelemetry,
	type ChatEntry,
	type InboxEntry,
	type MailKind,
} from '../mailbox-store'
import type { ProjectBlock } from '../../../superhive-pi-truth/settings-schema'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface PostToProjectInput {
	body: string
	kind?: MailKind
	refMessageId?: string
}

export interface AskMemberInput {
	toAgentId: string
	body: string
	kind?: Exclude<MailKind, 'broadcast'>
	refMessageId?: string
}

export interface ReadInboxOpts {
	limit?: number
	markAsRead?: boolean
}

export interface MailItem {
	id: string
	ts: number
	fromAgentId: string
	fromAgentName?: string
	kind?: MailKind
	body: string
	refMessageId?: string
	status?: 'pending' | 'delivered' | 'acked'
}

export interface BroadcastHooks {
	broadcastAgentMail: (agentId: string, item: MailItem) => void
	broadcastMailboxChanged: () => void
}

// ---------------------------------------------------------------------------
// Role resolution
// ---------------------------------------------------------------------------

export interface AgentProjectContext {
	agentId: string
	agentDir: string
	role: 'coordinator' | 'member' | 'standalone'
	projectBlock: ProjectBlock | null
}

export function readAgentProjectContext(agentId: string): AgentProjectContext {
	const agent = AgentRepository.getAllSync().find((a) => a.id === agentId)
	if (!agent || !agent.localPath) {
		return { agentId, agentDir: '', role: 'standalone', projectBlock: null }
	}
	const settingsPath = manageFilePathFor(agent.localPath)
	if (!existsSync(settingsPath)) {
		return { agentId, agentDir: agent.localPath, role: 'standalone', projectBlock: null }
	}
	try {
		const raw = readFileSync(settingsPath, 'utf8')
		const settings = JSON.parse(raw) as { project?: ProjectBlock }
		const projectBlock = settings.project ?? null
		if (!projectBlock) {
			return { agentId, agentDir: agent.localPath, role: 'standalone', projectBlock: null }
		}
		const isCoord = projectBlock.coordinatorAgentId === agentId
		return {
			agentId,
			agentDir: agent.localPath,
			role: isCoord ? 'coordinator' : 'member',
			projectBlock,
		}
	} catch (err) {
		log.warn(
			`[ipc:mailbox] failed to read settings for ${agentId}: ${err instanceof Error ? err.message : String(err)}`,
		)
		return { agentId, agentDir: agent.localPath, role: 'standalone', projectBlock: null }
	}
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export function handlePostToProject(
	fromAgentId: string,
	input: PostToProjectInput,
	hooks: BroadcastHooks,
): { ok: boolean; messageId?: string; error?: string } {
	const ctx = readAgentProjectContext(fromAgentId)
	if (ctx.role === 'standalone' || !ctx.projectBlock?.localPath) {
		return { ok: false, error: 'agent is not in a project' }
	}
	const coordDir = join(ctx.projectBlock.localPath, 'agent')
	const fromAgent = AgentRepository.getAllSync().find((a) => a.id === fromAgentId)
	const entry: ChatEntry = {
		id: crypto.randomUUID(),
		ts: Date.now(),
		role: 'assistant',
		parts: [{ type: 'text', text: input.body }],
		fromAgentId,
		fromAgentName: fromAgent?.name,
		kind: input.kind ?? 'request',
		refMessageId: input.refMessageId,
	}
	try {
		appendProjectChat(coordDir, entry)
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[mailbox] appendProjectChat failed: ${msg}`)
		return { ok: false, error: msg }
	}
	if (ctx.agentDir) {
		writeMailTelemetry(ctx.agentDir, {
			ts: Date.now(),
			type: 'mail',
			direction: 'sent',
			messageId: entry.id,
			fromAgentId,
			toAgentId: ctx.projectBlock.coordinatorAgentId ?? '',
			kind: entry.kind!,
			projectId: ctx.projectBlock.id,
		})
	}
	hooks.broadcastAgentMail(fromAgentId, {
		id: entry.id,
		ts: entry.ts,
		fromAgentId,
		fromAgentName: fromAgent?.name,
		kind: entry.kind,
		body: input.body,
		refMessageId: input.refMessageId,
		status: 'pending',
	})
	hooks.broadcastMailboxChanged()
	return { ok: true, messageId: entry.id }
}

export function handleAskMember(
	fromAgentId: string,
	input: AskMemberInput,
	hooks: BroadcastHooks,
): { ok: boolean; messageId?: string; error?: string } {
	const toAgent = AgentRepository.getAllSync().find((a) => a.id === input.toAgentId)
	if (!toAgent || !toAgent.localPath) {
		return { ok: false, error: `unknown agent: ${input.toAgentId}` }
	}
	const entry: InboxEntry = {
		id: crypto.randomUUID(),
		ts: Date.now(),
		fromAgentId,
		toAgentId: input.toAgentId,
		kind: input.kind ?? 'request',
		body: input.body,
		refMessageId: input.refMessageId,
		status: 'pending',
	}
	try {
		appendMemberInbox(toAgent.localPath, entry)
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.error(`[mailbox] appendMemberInbox failed: ${msg}`)
		return { ok: false, error: msg }
	}
	const fromCtx = readAgentProjectContext(fromAgentId)
	if (fromCtx.agentDir) {
		writeMailTelemetry(fromCtx.agentDir, {
			ts: Date.now(),
			type: 'mail',
			direction: 'sent',
			messageId: entry.id,
			fromAgentId,
			toAgentId: input.toAgentId,
			kind: entry.kind,
			projectId: fromCtx.projectBlock?.id,
		})
	}
	hooks.broadcastAgentMail(input.toAgentId, {
		id: entry.id,
		ts: entry.ts,
		fromAgentId,
		kind: entry.kind,
		body: input.body,
		refMessageId: input.refMessageId,
		status: 'pending',
	})
	hooks.broadcastMailboxChanged()
	return { ok: true, messageId: entry.id }
}

export function handleReadInbox(agentId: string, opts: ReadInboxOpts = {}): MailItem[] {
	const ctx = readAgentProjectContext(agentId)
	if (ctx.role === 'standalone' || !ctx.projectBlock) {
		return []
	}
	const limit = opts.limit ?? 50
	const markAsRead = opts.markAsRead ?? true

	if (ctx.role === 'coordinator') {
		const coordDir = join(ctx.projectBlock.localPath!, 'agent')
		const entries = readProjectChat(coordDir, {
			limit,
			kinds: ['request', 'question', 'broadcast', 'result'],
			excludeFromAgentIds: [agentId, null],
		})
		if (markAsRead) {
			for (const e of entries) {
				markChatEntryDelivered(coordDir, e.id, agentId).catch((err) => {
					log.warn(`[mailbox] markDelivered failed: ${err instanceof Error ? err.message : String(err)}`)
				})
			}
		}
		return entries.map(chatEntryToMailItem)
	}

	const items = readMemberInbox(ctx.agentDir, { limit })
	if (markAsRead) {
		for (const item of items) {
			if (item.status === 'pending') {
				ackInboxMessage(ctx.agentDir, item.id).catch((err) => {
					log.warn(`[mailbox] ackInboxMessage failed: ${err instanceof Error ? err.message : String(err)}`)
				})
			}
		}
	}
	return items.map(inboxEntryToMailItem)
}

export function handleAckMessage(
	agentId: string,
	messageId: string,
	hooks: BroadcastHooks,
): { ok: boolean; error?: string } {
	const ctx = readAgentProjectContext(agentId)
	if (ctx.role === 'standalone' || !ctx.projectBlock) {
		return { ok: false, error: 'agent is not in a project' }
	}

	if (ctx.role === 'coordinator') {
		const coordDir = join(ctx.projectBlock.localPath!, 'agent')
		markChatEntryDelivered(coordDir, messageId, agentId)
			.then((ok) => {
				if (ok) {
					hooks.broadcastAgentMail(agentId, {
						id: messageId,
						ts: Date.now(),
						fromAgentId: '',
						body: '',
						status: 'delivered',
					} as MailItem)
				}
			})
			.catch((err) => {
				log.warn(`[mailbox] markDelivered failed: ${err instanceof Error ? err.message : String(err)}`)
			})
		return { ok: true }
	}

	ackInboxMessage(ctx.agentDir, messageId)
		.then((ok) => {
			if (ok && ctx.agentDir) {
				writeMailTelemetry(ctx.agentDir, {
					ts: Date.now(),
					type: 'mail',
					direction: 'acked',
					messageId,
					fromAgentId: '',
					toAgentId: agentId,
					kind: 'request',
					projectId: ctx.projectBlock?.id,
				})
				hooks.broadcastAgentMail(agentId, {
					id: messageId,
					ts: Date.now(),
					fromAgentId: '',
					body: '',
					status: 'acked',
				} as MailItem)
			}
		})
		.catch((err) => {
			log.warn(`[mailbox] ackInboxMessage failed: ${err instanceof Error ? err.message : String(err)}`)
		})
	return { ok: true }
}

// ---------------------------------------------------------------------------
// Project/coordinator resolvers (used by the watcher hooks in mailbox.ts)
// ---------------------------------------------------------------------------

export function resolveProjectForWorkerSync(workerId: string): string | null {
	const worker = AgentRepository.getAllSync().find((a) => a.id === workerId)
	if (!worker || !worker.projectIds || worker.projectIds.length === 0) return null
	const projectId = worker.projectIds[0]
	if (!projectId) return null
	return readProjectLocalPathSync(projectId)
}

export function readProjectLocalPathSync(projectId: string): string | null {
	const { getUserDataPath } = require('../../src/storage/database') as typeof import('../../src/storage/database')
	const userData = getUserDataPath()
	if (!userData) return null
	const path = require('node:path') as typeof import('node:path')
	const fs = require('node:fs') as typeof import('node:fs')
	const dbPath = path.join(userData, 'db.projects.json')
	if (!fs.existsSync(dbPath)) return null
	try {
		const raw = fs.readFileSync(dbPath, 'utf8')
		const projects = JSON.parse(raw) as Array<{ id: string; localPath?: string }>
		return projects.find((p) => p.id === projectId)?.localPath ?? null
	} catch {
		return null
	}
}

export function resolveCoordinatorForProjectSync(projectLocalPath: string): string | null {
	const coordDir = join(projectLocalPath, 'agent')
	const settingsPath = manageFilePathFor(coordDir)
	if (!existsSync(settingsPath)) return null
	try {
		const raw = readFileSync(settingsPath, 'utf8')
		const settings = JSON.parse(raw) as { project?: { coordinatorAgentId?: string } }
		return settings.project?.coordinatorAgentId ?? null
	} catch {
		return null
	}
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

export function chatEntryToMailItem(entry: ChatEntry): MailItem {
	const text = entry.parts.map((p) => p.text).join('')
	return {
		id: entry.id,
		ts: entry.ts,
		fromAgentId: entry.fromAgentId ?? '',
		fromAgentName: entry.fromAgentName,
		kind: entry.kind,
		body: text,
		refMessageId: entry.refMessageId,
		status: entry.deliveredTo ? 'delivered' : 'pending',
	}
}

export function inboxEntryToMailItem(entry: InboxEntry): MailItem {
	return {
		id: entry.id,
		ts: entry.ts,
		fromAgentId: entry.fromAgentId,
		kind: entry.kind,
		body: entry.body,
		refMessageId: entry.refMessageId,
		status: entry.status,
	}
}
