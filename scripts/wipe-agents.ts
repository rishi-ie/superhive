#!/usr/bin/env bun
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { execSync } from 'node:child_process'

const APP_SUPPORT = join(homedir(), 'Library/Application Support', 'Superhive')
const AGENTS_DB   = join(APP_SUPPORT, 'db.agents.json')
const AGENTS_DIR  = join(homedir(), '.superhive', 'agents')

async function main() {
  console.log('▸ wipe-agents: starting')

  // Safety: refuse if Electron app still running
  try {
    const procs = execSync(
      "pgrep -f 'Electron.*Superhive|\\.electron/build' || true",
      { encoding: 'utf8' }
    )
    if (procs.trim()) {
      console.error('✗ Electron app still running — quit it first (Cmd+Q)')
      process.exit(1)
    }
  } catch {
    // pgrep returns non-zero when no match — that's fine
  }

  // 1. Zero out agents DB (preserve file, keep schema)
  if (existsSync(AGENTS_DB)) {
    const before = JSON.parse(readFileSync(AGENTS_DB, 'utf8'))
    console.log(`▸ db.agents.json: ${before.length} agent(s) → []`)
    writeFileSync(AGENTS_DB, '[]\n')
  } else {
    console.log('▸ db.agents.json: not found, skipping')
  }

  // 2. Wipe per-agent folders (preserve manifest-pi-template/ + .superhive/)
  if (existsSync(AGENTS_DIR)) {
    const entries = await import('node:fs').then(fs => fs.readdirSync(AGENTS_DIR))
    for (const e of entries) {
      if (e === 'manifest-pi-template') {
        console.log(`▸   keep ${e}/`)
        continue
      }
      const p = join(AGENTS_DIR, e)
      await rm(p, { recursive: true, force: true })
      console.log(`▸   rm ${e}/`)
    }
  } else {
    console.log('▸ ~/.superhive/agents/: not found, skipping')
  }

  console.log('▸ wipe-agents: done. Restart Electron to see empty sidebar.')
}

main().catch((e) => { console.error('✗', e.message); process.exit(1) })
