import { existsSync, readFileSync, writeFileSync, readdirSync, renameSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import log from 'electron-log/main'
import { AgentRepository } from '../src/storage/repositories/AgentRepository'
import { getBundledExtensionPath, hasBundledExtension } from './extension-source'

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

  // 0.5. Backfill extension dir AND patch manifest.json in a single pass per agent.
  //       This avoids the ordering bug where 0.5 ran before 0.6 — leaving agents with
  //       an on-disk extension but no manifest reference (dead end for the bridge).
  for (const agent of dbAgents) {
    if (!agent.localPath) continue
    const jsonPath = join(agent.localPath, 'manifest.json')
    if (!existsSync(jsonPath)) continue
    const extIndexPath = join(agent.localPath, 'extensions', 'superhive-pi-truth', 'index.ts')

    // Backfill extension dir from bundled source if missing
    if (!existsSync(extIndexPath) && hasBundledExtension()) {
      const bundledSrc = getBundledExtensionPath()
      await mkdir(join(agent.localPath, 'extensions'), { recursive: true })
      await cp(bundledSrc, join(agent.localPath, 'extensions', 'superhive-pi-truth'), { recursive: true })
      log.info(`[reconcile] backfilled bundled extension for ${agent.name}`)
    }

    // Patch manifest.extensions if extension dir is now on disk
    if (!existsSync(extIndexPath)) continue
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as Record<string, unknown>
    const existing = Array.isArray(raw.extensions) ? (raw.extensions as unknown[]) : []
    const extPath = './extensions/superhive-pi-truth'
    if (existing.includes(extPath)) continue
    raw.extensions = [...existing, extPath]
    writeFileSync(jsonPath, JSON.stringify(raw, null, '\t') + '\n', 'utf8')
    log.info(`[reconcile] patched manifest.json extensions for ${agent.name}`)
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
      if (!existsSync(join(localPath, 'extensions', 'superhive-pi-truth', 'index.ts')) && hasBundledExtension()) {
        const bundledSrc = getBundledExtensionPath()
        await mkdir(join(localPath, 'extensions'), { recursive: true })
        await cp(bundledSrc, join(localPath, 'extensions', 'superhive-pi-truth'), { recursive: true })
        log.info(`[reconcile] backfilled bundled extension for orphan ${folder}`)
      }

      // Patch manifest.extensions for orphan (after backfill so ext dir is present)
      const extIndexPath = join(localPath, 'extensions', 'superhive-pi-truth', 'index.ts')
      if (existsSync(extIndexPath)) {
        const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as Record<string, unknown>
        const existing = Array.isArray(raw.extensions) ? (raw.extensions as unknown[]) : []
        const extPath = './extensions/superhive-pi-truth'
        if (!existing.includes(extPath)) {
          raw.extensions = [...existing, extPath]
          writeFileSync(jsonPath, JSON.stringify(raw, null, '\t') + '\n', 'utf8')
          log.info(`[reconcile] patched orphan manifest.json extensions for ${folder}`)
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

  // 3. Sync agent.json from manifest.json so legacy `agent.sh` --manifest path
  //    resolves to the up-to-date config. Final pass so we capture any
  //    extensions additions from step 0.5 above.
  for (const agent of dbAgents) {
    if (!agent.localPath) continue
    const manifestPath = join(agent.localPath, 'manifest.json')
    const agentJsonPath = join(agent.localPath, 'agent.json')
    if (!existsSync(manifestPath)) continue
    const content = readFileSync(manifestPath, 'utf8')
    const existing = existsSync(agentJsonPath) ? readFileSync(agentJsonPath, 'utf8') : null
    if (existing === content) continue
    writeFileSync(agentJsonPath, content, 'utf8')
    log.info(`[reconcile] synced agent.json from manifest.json for ${agent.name}`)
  }

  log.info(`[reconcile] done — adopted=${adopted} missing=${missing}`)
}
