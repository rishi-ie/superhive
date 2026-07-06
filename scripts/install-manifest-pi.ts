#!/usr/bin/env bun
/**
 * Install the manifest-pi template to ~/.superhive/manifest-pi-template/
 * Run once before the app: bun run install:pi
 *
 * Idempotent — safe to re-run. Checks for agent.sh before cloning.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TEMPLATE_DIR = join(homedir(), '.superhive', 'manifest-pi-template')
const TEMPLATE_URL = 'https://github.com/rishi-ie/manifest-pi.git'
const SENTINEL = 'agent.sh'

function main(): void {
	if (existsSync(join(TEMPLATE_DIR, SENTINEL))) {
		console.log(`[install:pi] template already present at ${TEMPLATE_DIR}`)
		return
	}

	mkdirSync(join(homedir(), '.superhive'), { recursive: true })
	console.log(`[install:pi] cloning ${TEMPLATE_URL}\n  → ${TEMPLATE_DIR}`)

	try {
		execFileSync('git', ['clone', TEMPLATE_URL, TEMPLATE_DIR], { stdio: 'inherit' })
	} catch {
		console.error('[install:pi] git clone failed. Check your network and try again.')
		process.exit(1)
	}

	if (!existsSync(join(TEMPLATE_DIR, SENTINEL))) {
		console.error('[install:pi] clone succeeded but agent.sh is missing — template may be corrupted.')
		process.exit(1)
	}

	console.log('[install:pi] done')
}

main()
