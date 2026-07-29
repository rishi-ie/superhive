import { mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { queueWrite } from '../../src/storage/queue-write'
import { parseProjectChannelMessage } from '../../src/orchestration/contracts'
import type {
  ProjectChannelMessage,
  ProjectMessageReceipt,
} from '../../src/orchestration/domain/entities'
import type {
  ProjectConversationPage,
  ProjectConversationStore,
} from '../../src/orchestration/ports'
import { FilesystemOrchestrationLayout } from './filesystem-layout'

export class FilesystemProjectConversationStore implements ProjectConversationStore {
  constructor(private readonly layout: FilesystemOrchestrationLayout) {}

  async append(messages: ProjectChannelMessage[]): Promise<void> {
    if (messages.length === 0) return
    const path = await this.layout.messages(messages[0]!.projectId)
    await mkdir(dirname(path), { recursive: true })
    await queueWrite(path, async () => {
      const existing = await this.list(messages[0]!.projectId)
      const ids = new Set(existing.messages.map((message) => message.id))
      const fresh = messages.filter((message) => !ids.has(message.id))
      if (fresh.length === 0) return
      const { appendFile } = await import('node:fs/promises')
      await appendFile(path, fresh.map((message) => JSON.stringify(message)).join('\n') + '\n', 'utf8')
    })
  }

  async list(projectId: string, cursor?: string): Promise<ProjectConversationPage> {
    try {
      const lines = (await readFile(await this.layout.messages(projectId), 'utf8')).split('\n').filter(Boolean)
      const offset = cursor ? Number.parseInt(cursor, 10) || 0 : 0
      const page = lines.slice(offset, offset + 500).map((line) => parseProjectChannelMessage(JSON.parse(line)))
      return {
        messages: page,
        nextCursor: offset + page.length < lines.length ? String(offset + page.length) : undefined,
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { messages: [] }
      throw error
    }
  }

  async appendReceipt(receipt: ProjectMessageReceipt): Promise<void> {
    const path = await this.layout.receipts(receipt.projectId)
    await mkdir(dirname(path), { recursive: true })
    await queueWrite(path, async () => {
      const { appendFile } = await import('node:fs/promises')
      await appendFile(path, JSON.stringify(receipt) + '\n', 'utf8')
    })
  }
}

