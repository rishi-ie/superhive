/**
 * Gap 2 mailbox IPC handlers.
 *
 * Thin wrapper over electron/ipc/mailbox-handlers.ts. The handler
 * functions live there so they can be unit-tested without booting a
 * real Electron instance. This file owns:
 *   - The 4 ipcMain.handle() channel registrations
 *   - The BrowserWindow broadcast helpers (real Electron APIs)
 *   - The mailbox-watcher hook wiring for runtime.send() wake prompts
 *
 * The orchestrator extension (superhive-pi-orchestration) does its own
 * pure-FS appends via project.ts helpers — same on-disk format. The
 * watcher (`mailbox-watcher.ts`) sees both this IPC's writes and the
 * extension's writes indistinguishably.
 */

import { ipcMain, BrowserWindow } from 'electron'
import log from 'electron-log/main'
import { IPC } from './index'
import {
	handlePostToProject as rawHandlePostToProject,
	handleAskMember as rawHandleAskMember,
	handleReadInbox as rawHandleReadInbox,
	handleAckMessage as rawHandleAckMessage,
	resolveProjectForWorkerSync,
	resolveCoordinatorForProjectSync,
	type MailItem,
} from './mailbox-handlers'

const NOOP_HOOKS = {
	broadcastAgentMail: () => {},
	broadcastMailboxChanged: () => {},
}

export function registerMailboxIpc(): void {
	ipcMain.handle(
		IPC.AGENTS.POST_TO_PROJECT,
		(_e, fromAgentId: string, input: Parameters<typeof rawHandlePostToProject>[1]) => {
			return rawHandlePostToProject(fromAgentId, input, {
				broadcastAgentMail,
				broadcastMailboxChanged,
			})
		},
	)

	ipcMain.handle(
		IPC.AGENTS.ASK_MEMBER,
		(_e, fromAgentId: string, input: Parameters<typeof rawHandleAskMember>[1]) => {
			return rawHandleAskMember(fromAgentId, input, {
				broadcastAgentMail,
				broadcastMailboxChanged,
			})
		},
	)

	ipcMain.handle(
		IPC.AGENTS.READ_INBOX,
		(_e, agentId: string, opts?: Parameters<typeof rawHandleReadInbox>[1]) => {
			return rawHandleReadInbox(agentId, opts)
		},
	)

	ipcMain.handle(
		IPC.AGENTS.ACK_MESSAGE,
		(_e, agentId: string, messageId: string) => {
			return rawHandleAckMessage(agentId, messageId, {
				broadcastAgentMail,
				broadcastMailboxChanged,
			})
		},
	)
}

/**
 * Wire the mailbox watcher's notification hooks to runtime.send() so
 * that a new chat entry wakes the coordinator and a new inbox entry
 * wakes the recipient member. Called by main.ts at startup.
 */
export function attachMailboxWatches(): void {
	const { mailboxWatcher } = require('../mailbox-watcher') as typeof import('../mailbox-watcher')
	const { runtime } = require('../general-kai-runtime') as typeof import('../general-kai-runtime')

	mailboxWatcher.onCoordMail = (entry) => {
		const projectLocalPath = entry.fromAgentId
			? resolveProjectForWorkerSync(entry.fromAgentId)
			: null
		if (!projectLocalPath) {
			broadcastMailboxChanged()
			return
		}
		const coordId = resolveCoordinatorForProjectSync(projectLocalPath)
		if (!coordId) {
			broadcastMailboxChanged()
			return
		}
		const senderName = entry.fromAgentName ?? 'a team member'
		runtime.send(
			coordId,
			`[mail] New message from ${senderName} in project chat. Call read_inbox to inspect.`,
		)
	}

	mailboxWatcher.onMemberMail = (memberId) => {
		runtime.send(
			memberId,
			`[mail] You have a new direct ask. Call read_inbox to inspect.`,
		)
	}

	mailboxWatcher.start()
}

// Silence the noop-hooks warning — they're used for testing the
// handlers in isolation; the IPC layer injects real broadcast helpers.
void NOOP_HOOKS

function broadcastAgentMail(agentId: string, item: MailItem): void {
	for (const win of BrowserWindow.getAllWindows()) {
		if (!win.isDestroyed()) {
			win.webContents.send(`agent:${agentId}:mail`, item)
		}
	}
}

function broadcastMailboxChanged(): void {
	for (const win of BrowserWindow.getAllWindows()) {
		if (!win.isDestroyed()) {
			win.webContents.send('mailbox:changed', { ts: Date.now() })
		}
	}
}

void log
