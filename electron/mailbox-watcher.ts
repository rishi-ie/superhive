/**
 * MailboxWatcher — tails Gap 2 mailbox files and emits wake-up events.
 *
 * Watches two file types per running project:
 *
 *   - `<projectDir>/agent/chat.jsonl` — the project chat. New entries
 *     from non-user, non-coordinator agents → wake the coordinator
 *     (so it can call `read_inbox` and decide what to do).
 *
 *   - `<memberDir>/inbox.jsonl` — per-member direct-ask inbox. New
 *     pending entries → wake the member (so it can call `read_inbox`
 *     and answer).
 *
 * The watcher is purely a tailer. It does NOT rewrite the DB, send IPC,
 * or call Pi. Notification hooks (`onCoordMail`, `onMemberMail`) are
 * set by the main process at startup and call `runtime.send(id, …)`
 * to inject the wake prompt into the agent's running session.
 *
 * Sources of fs events:
 *   - `fs.watch` on each watched dir (low latency, but macOS kqueue
 *     coalesces rapid create+write sequences).
 *   - A 5 s polling fallback that catches anything `fs.watch` missed
 *     (covers watcher failures on network drives, etc.).
 *
 * Debounce: 250 ms after the last event before a notification. Avoids
 * storming wake prompts when several entries are appended in a burst.
 */

import { existsSync, readFileSync, watch, type FSWatcher } from 'node:fs'
import { join } from 'node:path'
import log from 'electron-log/main'
import {
	type ChatEntry,
	type InboxEntry,
} from './mailbox-store'

const DEBOUNCE_MS = 250
const POLL_INTERVAL_MS = 5000

interface AgentInfo {
	agentId: string
	agentDir: string
	projectDir?: string
	/** For the coordinator: their own id. Used to filter self-posts. */
	coordinatorId?: string
}

interface WatcherEntry {
	watchers: FSWatcher[]
	debounceTimer: NodeJS.Timeout | null
	/** Last line count we processed — used to detect new entries. */
	lastChatSize: number
	lastInboxSize: number
}

class MailboxWatcherImpl {
	private entries = new Map<string, WatcherEntry>()
	/** agentId → projectDir mapping (for looking up the coord when a
	 *  member posts; needed by onCoordMail to find the coord). */
	private agentToProject = new Map<string, string>()
	/** projectDir → coordinatorId (for filtering self-posts). */
	private projectToCoord = new Map<string, string>()
	private pollTimer: NodeJS.Timeout | null = null
	private stopped = true

	/** Set by main.ts at startup. */
	onCoordMail?: (entry: ChatEntry) => void
	onMemberMail?: (memberId: string, entry: InboxEntry) => void

	start(): void {
		if (!this.stopped) return
		this.stopped = false
		this.startPoll()
		log.info('[mailbox-watcher] started')
	}

	stop(): void {
		if (this.stopped) return
		this.stopped = true
		if (this.pollTimer) {
			clearTimeout(this.pollTimer)
			this.pollTimer = null
		}
		for (const entry of this.entries.values()) {
			if (entry.debounceTimer) clearTimeout(entry.debounceTimer)
			for (const w of entry.watchers) {
				try { w.close() } catch { /* ignore */ }
			}
		}
		this.entries.clear()
		this.agentToProject.clear()
		this.projectToCoord.clear()
		log.info('[mailbox-watcher] stopped')
	}

	/** Register an agent for mailbox watching. Called on agent start.
	 *  - `agentId` is the agent's UUID
	 *  - `agentDir` is the agent's <agentDir>
	 *  - `projectDir` is the project root if this agent is a project
	 *    member; undefined for standalone agents
	 *  - `coordinatorId` is the coordinator's UUID when the agent
	 *    being watched IS the coordinator (so the watcher can filter
	 *    self-posts out of `onCoordMail`) */
	watchAgent(opts: AgentInfo): void {
		const memberKey = opts.agentId
		this.entries.set(memberKey, {
			watchers: [],
			debounceTimer: null,
			lastChatSize: 0,
			lastInboxSize: 0,
		})
		if (opts.projectDir) {
			this.agentToProject.set(opts.agentId, opts.projectDir)
		}
		if (opts.coordinatorId && opts.projectDir) {
			this.projectToCoord.set(opts.projectDir, opts.coordinatorId)
		}

		// Always watch the agent's own inbox.jsonl (the per-member
		// direct-ask inbox).
		this.attachDirWatch(memberKey, opts.agentDir, () =>
			this.checkMemberInbox(opts.agentId),
		)

		// If the agent is a project member, also watch the project chat
		// (so the coordinator gets notified on worker posts). The project
		// chat lives at <projectDir>/agent/chat.jsonl. We watch the
		// parent dir of the chat file (= <projectDir>/agent) so we get
		// events when chat.jsonl is created/updated.
		if (opts.projectDir) {
			const projectKey = `project:${opts.projectDir}`
			this.entries.set(projectKey, {
				watchers: [],
				debounceTimer: null,
				lastChatSize: 0,
				lastInboxSize: 0,
			})
			const projectChatDir = join(opts.projectDir, 'agent')
			this.attachDirWatch(projectKey, projectChatDir, () =>
				this.checkProjectChat(opts.projectDir!),
			)
		}

		// Cold-start wake: if the agent's inbox already has pending
		// entries (e.g. the worker was offline when the coordinator
		// called ask_member), fire onMemberMail now so the worker
		// wakes immediately on attach instead of waiting up to
		// POLL_INTERVAL_MS for the polling fallback. Same for the
		// project chat if a worker posted while the coordinator was
		// down. This updates lastInboxSize/lastChatSize so the next
		// poll won't refire the same entries.
		this.checkMemberInbox(opts.agentId)
		if (opts.projectDir) {
			this.checkProjectChat(opts.projectDir)
		}
	}

	unwatchAgent(agentId: string): void {
		const entry = this.entries.get(agentId)
		if (!entry) return
		if (entry.debounceTimer) clearTimeout(entry.debounceTimer)
		for (const w of entry.watchers) {
			try { w.close() } catch { /* ignore */ }
		}
		this.entries.delete(agentId)
		this.agentToProject.delete(agentId)
		// Note: projectToCoord is intentionally not cleared here. The
		// mapping is keyed by projectDir (not agentId), so removing the
		// coordinator's entry when the coordinator stops is the right
		// time. We accept the small risk of stale entries if a coord
		// is removed without a matching unregister; the next reconcile
		// cleans up via `unwatchProject` (callers that know).
	}

	/** Explicit cleanup when a project is removed. */
	unwatchProject(projectDir: string): void {
		this.projectToCoord.delete(projectDir)
		const key = `project:${projectDir}`
		const entry = this.entries.get(key)
		if (!entry) return
		if (entry.debounceTimer) clearTimeout(entry.debounceTimer)
		for (const w of entry.watchers) {
			try { w.close() } catch { /* ignore */ }
		}
		this.entries.delete(key)
	}

	// --- watchers ----------------------------------------------------------

	private attachDirWatch(key: string, dir: string, onChange: () => void): void {
		const entry = this.entries.get(key)
		if (!entry) return
		if (!existsSync(dir)) return
		try {
			const w = watch(dir, () => this.scheduleCheck(key, onChange))
			entry.watchers.push(w)
		} catch (err) {
			log.warn(
				`[mailbox-watcher] watch failed for ${dir}; polling fallback will carry it:`,
				err,
			)
		}
	}

	// --- debounce ----------------------------------------------------------

	private scheduleCheck(key: string, onChange: () => void): void {
		if (this.stopped) return
		const entry = this.entries.get(key)
		if (!entry) return
		if (entry.debounceTimer) clearTimeout(entry.debounceTimer)
		entry.debounceTimer = setTimeout(() => {
			entry.debounceTimer = null
			try {
				onChange()
			} catch (err) {
				log.warn('[mailbox-watcher] check failed:', err)
			}
		}, DEBOUNCE_MS)
	}

	private startPoll(): void {
		if (this.pollTimer) return
		const tick = () => {
			if (this.stopped) return
			// Re-check all known agents' inboxes + all known project chats.
			for (const [agentId, entry] of this.entries) {
				if (entry.debounceTimer) continue
				if (agentId.startsWith('project:')) {
					const projectDir = agentId.slice('project:'.length)
					this.checkProjectChat(projectDir)
				} else {
					this.checkMemberInbox(agentId)
				}
			}
			this.pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
		}
		this.pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
	}

	// --- checks ------------------------------------------------------------

	private checkMemberInbox(memberId: string): void {
		if (!this.onMemberMail) return
		const entry = this.entries.get(memberId)
		if (!entry) return
		const memberDir = this.resolveMemberDir(memberId)
		if (!memberDir) return

		// Use the line count to skip work if nothing changed.
		const path = join(memberDir, 'inbox.jsonl')
		if (!existsSync(path)) return

		const raw = readFileSync(path, 'utf8')
		const lines = raw.split('\n').filter(Boolean)
		if (lines.length <= entry.lastInboxSize) {
			// Already processed up to this size.
			if (lines.length !== entry.lastInboxSize) {
				// File shrank (rolled over or rewritten). Reset and re-fire.
				entry.lastInboxSize = 0
			} else {
				return
			}
		}

		// Fire onMemberMail for each new line, in order. Each line is
		// independent — the consumer (main process) can decide whether to
		// dedupe or just inject one wake prompt per call.
		const startIdx = Math.max(0, entry.lastInboxSize)
		for (let i = startIdx; i < lines.length; i++) {
			const line = lines[i]
			if (!line) continue
			try {
				const parsed = JSON.parse(line) as InboxEntry
				this.onMemberMail(memberId, parsed)
			} catch (err) {
				log.warn(
					`[mailbox-watcher] skipping malformed inbox line for ${memberId}: ${err instanceof Error ? err.message : String(err)}`,
				)
			}
		}
		entry.lastInboxSize = lines.length
	}

	private checkProjectChat(projectDir: string): void {
		if (!this.onCoordMail) return
		const key = `project:${projectDir}`
		const entry = this.entries.get(key)
		if (!entry) return

		const chatPath = join(projectDir, 'agent', 'chat.jsonl')
		if (!existsSync(chatPath)) return

		const raw = readFileSync(chatPath, 'utf8')
		const lines = raw.split('\n').filter(Boolean)
		if (lines.length <= entry.lastChatSize) {
			if (lines.length !== entry.lastChatSize) {
				entry.lastChatSize = 0
			} else {
				return
			}
		}

		const coordId = this.projectToCoord.get(projectDir) ?? null
		const startIdx = Math.max(0, entry.lastChatSize)
		for (let i = startIdx; i < lines.length; i++) {
			const line = lines[i]
			if (!line) continue
			try {
				const parsed = JSON.parse(line) as ChatEntry
				// Only fire on worker messages (filter out user + coord self).
				const fromId = parsed.fromAgentId ?? null
				if (fromId === null) continue
				if (coordId && fromId === coordId) continue
				this.onCoordMail(parsed)
			} catch (err) {
				log.warn(
					`[mailbox-watcher] skipping malformed chat line for ${projectDir}: ${err instanceof Error ? err.message : String(err)}`,
				)
			}
		}
		entry.lastChatSize = lines.length
	}

	private resolveMemberDir(agentId: string): string | null {
		// The watcher entry's `watchers` already point at the right dir.
		// We just need the dir name; the entry's first watcher's path
		// isn't directly exposed, so we accept agentDir via the
		// agentToDir map below.
		return this.agentToDir.get(agentId) ?? null
	}

	/** Companion map for resolveMemberDir. Kept separate from
	 *  agentToProject so the type stays narrow. */
	private agentToDir = new Map<string, string>()

	/** Internal — sets the agent's directory on watchAgent. */
	_setAgentDir(agentId: string, agentDir: string): void {
		this.agentToDir.set(agentId, agentDir)
	}
}

export const mailboxWatcher = new MailboxWatcherImpl()

// Patch watchAgent to also record the agentDir. Cleaner than splitting
// the API surface. We do this via a property accessor to keep the
// external signature stable.
const origWatchAgent = mailboxWatcher.watchAgent.bind(mailboxWatcher)
mailboxWatcher.watchAgent = (opts: AgentInfo) => {
	mailboxWatcher._setAgentDir(opts.agentId, opts.agentDir)
	origWatchAgent(opts)
}
