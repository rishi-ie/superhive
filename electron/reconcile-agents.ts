import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import log from 'electron-log/main'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'

const DEFAULT_PARENT_DIR = join(homedir(), '.superhive', 'agents')

interface OnDiskAgentConfig {
  superhiveId?: string
  version: number
  name: string
  description?: string
  manifestPiSource?: string
  [k: string]: unknown
}

export async function reconcileAgents(): Promise<void> {
  log.info('[reconcile] starting')

  const dbAgents = await AgentRepository.getAll()
  const byLocalPath = new Map<string, (typeof dbAgents)[number]>()
  for (const a of dbAgents) {
    if (a.localPath) byLocalPath.set(a.localPath, a)
  }

  let adopted = 0
  let missing = 0

  // 1. Scan default parent dir for orphan folders (no DB row)
  try {
    const folders = readdirSync(DEFAULT_PARENT_DIR, { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() &&
          !d.name.startsWith('.') &&
          d.name !== 'manifest-pi-template'
      )
      .map((d) => d.name)

    for (const folder of folders) {
      const localPath = join(DEFAULT_PARENT_DIR, folder)
      const jsonPath = join(localPath, 'agent.json')
      if (!existsSync(jsonPath)) continue
      if (byLocalPath.has(localPath)) continue

      const disk = JSON.parse(readFileSync(jsonPath, 'utf8')) as OnDiskAgentConfig
      const agent = await AgentRepository.create({
        name: disk.name?.trim() || folder,
        localPath,
        manifestPiSource: disk.manifestPiSource,
        status: 'idle',
      })
      disk.superhiveId = agent.id
      writeFileSync(jsonPath, JSON.stringify(disk, null, 2) + '\n', 'utf8')
      adopted++
      log.info(`[reconcile] adopted ${folder} → ${agent.id}`)
    }
  } catch (err) {
    log.warn('[reconcile] could not scan default parent dir:', err)
  }

  // 2. Mark DB rows whose folders are gone as error
  for (const agent of dbAgents) {
    if (!agent.localPath) continue
    if (existsSync(agent.localPath)) continue

    await AgentRepository.update(agent.id, {
      status: 'error',
      lastError: `Agent folder missing: ${agent.localPath}`,
    })
    missing++
    log.info(`[reconcile] missing folder for ${agent.name} (${agent.id})`)
  }

  log.info(`[reconcile] done — adopted=${adopted} missing=${missing}`)
}
