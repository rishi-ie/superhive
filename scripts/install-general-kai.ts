#!/usr/bin/env bun
/**
 * Install the general-kai template to ~/.superhive/general-kai-template/
 * Run once before the app: bun run install:kai
 *
 * Idempotent — safe to re-run. Checks for agent.sh before cloning.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TEMPLATE_DIR = join(homedir(), '.superhive', 'general-kai-template')
const TEMPLATE_URL = 'https://github.com/rishi-ie/general-kai.git'
const SENTINEL = 'agent.sh'

function main(): void {
	if (existsSync(join(TEMPLATE_DIR, SENTINEL))) {
		console.log(`[install:kai] template already present at ${TEMPLATE_DIR}`)
		return
	}

	mkdirSync(join(homedir(), '.superhive'), { recursive: true })
	console.log(`[install:kai] cloning ${TEMPLATE_URL}\n  → ${TEMPLATE_DIR}`)

	try {
		execFileSync('git', ['clone', TEMPLATE_URL, TEMPLATE_DIR], { stdio: 'inherit' })
	} catch {
		console.error('[install:kai] git clone failed. Check your network and try again.')
		process.exit(1)
	}

	if (!existsSync(join(TEMPLATE_DIR, SENTINEL))) {
		console.error('[install:kai] clone succeeded but agent.sh is missing — template may be corrupted.')
		process.exit(1)
	}

	console.log('[install:kai] done')
}

main()
