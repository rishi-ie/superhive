#!/usr/bin/env bun
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: join(process.cwd(), '.env.local') })

const newKey = process.env.MINIMAX_API_KEY

if (!newKey?.trim()) {
  console.error('MINIMAX_API_KEY is not set in .env.local. Set it first, then run again.')
  process.exit(1)
}

const agentsDir = join(homedir(), '.superhive', 'agents')

let migrated = 0
let skipped = 0

const entries = await readdir(agentsDir, { withFileTypes: true }).catch(() => [])
for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const agentJsonPath = join(agentsDir, entry.name, 'agent.json')
  try {
    await stat(agentJsonPath)
  } catch {
    continue
  }
  const raw = await readFile(agentJsonPath, 'utf8')
  let manifest: Record<string, unknown>
  try {
    manifest = JSON.parse(raw)
  } catch {
    skipped++
    console.warn(`⚠ ${entry.name}: invalid JSON, skipped`)
    continue
  }
  const env = (manifest.environment as Record<string, unknown>) ?? {}
  const oldKey = env.MINI_MAX_API_KEY ?? env.MINIMAX_API_KEY
  if (oldKey === newKey) {
    skipped++
    continue
  }
  env.MINIMAX_API_KEY = newKey
  manifest.environment = env
  await writeFile(agentJsonPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  migrated++
  console.log(`✓ ${entry.name}: rewrote MINIMAX_API_KEY`)
}

console.log(`\nDone. ${migrated} agent(s) migrated, ${skipped} skipped.`)
