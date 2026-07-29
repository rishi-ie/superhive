import { existsSync, watch, type FSWatcher } from 'node:fs'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import log from 'electron-log/main'
import type { OrchestrationService } from '../../src/orchestration/application'
import { parseCommandEnvelope } from '../../src/orchestration/contracts'
import type { ProjectAgentDirectory, ProjectAgentRecord } from '../../src/orchestration/ports'
import type { InternalWakeQueue } from '../../src/orchestration/ports'

export class OrchestrationCommandOutboxWatcher {
  private readonly watchers = new Map<string, FSWatcher>()
  private readonly processing = new Set<string>()
  private refreshTimer: NodeJS.Timeout | null = null

  constructor(
    private readonly service: OrchestrationService,
    private readonly agents: ProjectAgentDirectory,
    private readonly listProjectIds: () => Promise<string[]>,
    private readonly wakeQueue: InternalWakeQueue,
  ) {}

  async start(): Promise<void> {
    await this.refresh()
    this.refreshTimer = setInterval(() => void this.refresh(), 2_000)
  }

  stop(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer)
    this.refreshTimer = null
    for (const watcher of this.watchers.values()) watcher.close()
    this.watchers.clear()
  }

  async refresh(): Promise<void> {
    for (const projectId of await this.listProjectIds()) {
      for (const agent of await this.agents.list(projectId)) await this.watchAgent(agent)
    }
  }

  private async watchAgent(agent: ProjectAgentRecord): Promise<void> {
    if (this.watchers.has(agent.id)) return
    const pending = join(agent.localPath, 'orchestration', 'outbox', 'pending')
    await mkdir(pending, { recursive: true })
    await mkdir(join(agent.localPath, 'orchestration', 'outbox', 'processed'), { recursive: true })
    await mkdir(join(agent.localPath, 'orchestration', 'outbox', 'rejected'), { recursive: true })
    const watcher = watch(pending, () => void this.processPending(agent))
    this.watchers.set(agent.id, watcher)
    await this.processPending(agent)
  }

  private async processPending(agent: ProjectAgentRecord): Promise<void> {
    const pending = join(agent.localPath, 'orchestration', 'outbox', 'pending')
    if (!existsSync(pending)) return
    for (const name of await readdir(pending)) {
      if (!name.endsWith('.json')) continue
      const path = join(pending, name)
      if (this.processing.has(path)) continue
      this.processing.add(path)
      try {
        const command = parseCommandEnvelope(JSON.parse(await readFile(path, 'utf8')))
        const result = await this.service.execute(command, {
          agentId: agent.id,
          displayName: agent.name,
          role: agent.role,
          projectId: agent.projectId,
        })
        const targetDir = join(agent.localPath, 'orchestration', 'outbox', result.ok ? 'processed' : 'rejected')
        const target = join(targetDir, name)
        await writeFile(`${target}.result`, JSON.stringify(result, null, '\t') + '\n', 'utf8')
        await rename(path, target)
        if (!result.ok) {
          await this.wakeQueue.enqueue({
            id: `command-rejected:${command.id}`,
            agentId: agent.id,
            reason: 'command_rejected',
            projectId: agent.projectId,
            messageId: command.id,
          })
        }
      } catch (error) {
        log.warn(`[orchestration:outbox] rejected ${path}:`, error)
        const target = join(agent.localPath, 'orchestration', 'outbox', 'rejected', name)
        await writeFile(`${target}.result`, JSON.stringify({
          ok: false,
          error: { code: 'invalid_command', message: error instanceof Error ? error.message : String(error) },
        }, null, '\t') + '\n', 'utf8')
        await rename(path, target).catch(() => undefined)
        const commandId = name.replace(/\.json$/, '')
        await this.wakeQueue.enqueue({
          id: `command-rejected:${commandId}`,
          agentId: agent.id,
          reason: 'command_rejected',
          projectId: agent.projectId,
          messageId: commandId,
        })
      } finally {
        this.processing.delete(path)
      }
    }
  }
}
