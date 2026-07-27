import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'
import { installAgentLaunchers, installBundledExtension } from './agent-assets'

describe('agent assets', () => {
	test('installs portable launchers without symlinks', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-assets-'))
		try {
			installAgentLaunchers(root)
			for (const name of ['agent-runner.mjs', 'agent.sh', 'agent.cmd', 'agent.ps1']) {
				expect(existsSync(join(root, name))).toBe(true)
			}
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})

	test('copies extension files into an agent directory', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-extension-'))
		const source = join(root, 'source')
		const target = join(root, 'target')
		try {
			mkdirSync(source, { recursive: true })
			writeFileSync(join(source, 'index.ts'), 'export default {}\n')
			installBundledExtension(source, target)
			expect(readFileSync(join(target, 'index.ts'), 'utf8')).toContain('export default')
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})

	test('forwards launcher arguments to the prepared Pi runtime', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-runner-'))
		const piDir = join(root, 'pi')
		const cli = join(piDir, 'packages', 'coding-agent', 'dist', 'cli.js')
		try {
			mkdirSync(join(piDir, 'packages', 'coding-agent', 'dist'), { recursive: true })
			writeFileSync(cli, 'console.log(JSON.stringify(process.argv.slice(2)))\n')
			const runner = join(process.cwd(), 'runtime', 'agent-runner.mjs')
			const result = spawnSync(process.execPath, [runner, '--mode', 'rpc', '--flag', 'value'], {
				encoding: 'utf8',
				env: { ...process.env, AGENT_DIR: root, PI_DIR: piDir, PI_NODE: process.execPath },
			})
			expect(result.status).toBe(0)
			expect(result.stdout).toContain('--mode')
			expect(result.stdout).toContain('rpc')
			expect(result.stdout).toContain('--flag')
			expect(result.stdout).toContain('value')
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})
})
