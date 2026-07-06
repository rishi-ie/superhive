#!/usr/bin/env bun
/**
 * Wipe all Superhive agent data and start fresh.
 * Run before upgrading to the new layout: bun run reset
 *
 * Idempotent — safe to re-run.
 */
import { rmSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

function nuke(p: string): void {
	if (!existsSync(p)) return
	console.log(`[reset] removing ${p}`)
	rmSync(p, { recursive: true, force: true })
}

const root = join(homedir(), '.superhive')

console.log('[reset] wiping agent data...')
nuke(join(root, 'agents'))
nuke(join(root, 'db'))

console.log('[reset] done — run bun run install:pi to reinstall the template')
