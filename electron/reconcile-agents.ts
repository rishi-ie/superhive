import { existsSync, readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
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

  // 0. Migration: rename legacy files from agent.json → manifest.json
  //             and .agent-initialized → .manifest-initialized
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
      const oldManifest = join(localPath, 'agent.json')
      const newManifest = join(localPath, 'manifest.json')
      if (existsSync(oldManifest) && !existsSync(newManifest)) {
        renameSync(oldManifest, newManifest)
        log.info(`[reconcile] migrated ${folder}/agent.json → manifest.json`)
      }
      const oldSentinel = join(localPath, '.agent-initialized')
      const newSentinel = join(localPath, '.manifest-initialized')
      if (existsSync(oldSentinel) && !existsSync(newSentinel)) {
        renameSync(oldSentinel, newSentinel)
        log.info(`[reconcile] migrated ${folder}/.agent-initialized → .manifest-initialized`)
      }
    }
  } catch (err) {
    log.warn('[reconcile] migration pass failed:', err)
  }

  // 0.5. Backfill extension dir onto existing DB agents that don't have it
  for (const agent of dbAgents) {
    if (!agent.localPath || !agent.manifestPiSource) continue
    const extDst = join(agent.localPath, 'extensions', 'superhive-pi-truth', 'index.ts')
    if (!existsSync(extDst)) {
      const extSrc = join(agent.manifestPiSource, 'extensions', 'superhive-pi-truth')
      if (existsSync(join(extSrc, 'index.ts'))) {
        await mkdir(join(agent.localPath, 'extensions'), { recursive: true })
        await cp(extSrc, join(agent.localPath, 'extensions', 'superhive-pi-truth'), { recursive: true })
        log.info(`[reconcile] backfilled extension for ${agent.name} (${agent.id})`)
      }
    }
  }

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
      const jsonPath = join(localPath, 'manifest.json')
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

      // Backfill extension dir onto newly adopted orphan
      if (disk.manifestPiSource) {
        const extSrc = join(disk.manifestPiSource, 'extensions', 'superhive-pi-truth')
        const extDst = join(localPath, 'extensions', 'superhive-pi-truth', 'index.ts')
        if (!existsSync(extDst) && existsSync(join(extSrc, 'index.ts'))) {
          await mkdir(join(localPath, 'extensions'), { recursive: true })
          await cp(extSrc, join(localPath, 'extensions', 'superhive-pi-truth'), { recursive: true })
          log.info(`[reconcile] backfilled extension for orphan ${folder}`)
        }
      }
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
