import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'
import { installAgentLaunchers } from './agent-assets'

describe('agent assets', () => {
	test('installs portable launchers and a shared runtime reference without symlinks', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-assets-'))
		try {
			installAgentLaunchers(root)
			for (const name of ['agent-runner.mjs', 'agent.sh', 'agent.cmd', 'agent.ps1']) {
				expect(existsSync(join(root, name))).toBe(true)
			}
			const reference = JSON.parse(readFileSync(join(root, 'superhive-runtime.json'), 'utf8'))
			expect(reference).toMatchObject({ version: 1, runtimeRoot: expect.any(String) })
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

	test('always passes manifest.json when a stale legacy settings file exists', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-runner-manifest-'))
		const piDir = join(root, 'pi')
		const runtimeRoot = join(root, 'runtime')
		const cli = join(piDir, 'packages', 'coding-agent', 'dist', 'cli.js')
		try {
			mkdirSync(join(piDir, 'packages', 'coding-agent', 'dist'), { recursive: true })
			writeFileSync(join(root, 'manifest.json'), JSON.stringify({ source: 'manifest' }))
			writeFileSync(join(root, 'superhive-runtime.json'), JSON.stringify({ version: 1, runtimeRoot }))
			writeFileSync(join(root, 'Superhive-pi-agent.json'), JSON.stringify({ source: 'legacy' }))
			writeFileSync(cli, "const fs = require('node:fs'); const i = process.argv.indexOf('--manifest'); console.log(fs.readFileSync(process.argv[i + 1], 'utf8'))\n")
			const runner = join(process.cwd(), 'runtime', 'agent-runner.mjs')
			const result = spawnSync(process.execPath, [runner, '--mode', 'rpc'], {
				encoding: 'utf8',
				env: { ...process.env, AGENT_DIR: root, PI_DIR: piDir, PI_NODE: process.execPath },
			})
			expect(result.status).toBe(0)
			expect(result.stdout).toContain('manifest')
			expect(result.stdout).not.toContain('legacy')
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})

	test('migrates legacy core extension paths to the shared runtime reference', () => {
		const root = mkdtempSync(join(tmpdir(), 'superhive-runner-reference-'))
		const piDir = join(root, 'pi')
		const runtimeRoot = join(root, 'runtime')
		const cli = join(piDir, 'packages', 'coding-agent', 'dist', 'cli.js')
		try {
			mkdirSync(join(piDir, 'packages', 'coding-agent', 'dist'), { recursive: true })
			writeFileSync(cli, '')
			writeFileSync(join(root, 'manifest.json'), JSON.stringify({
				extensions: ['./extensions/superhive-pi-truth', './extensions/custom'],
			}))
			writeFileSync(join(root, 'superhive-runtime.json'), JSON.stringify({ version: 1, runtimeRoot }))
			const runner = join(process.cwd(), 'runtime', 'agent-runner.mjs')
			spawnSync(process.execPath, [runner], {
				encoding: 'utf8',
				env: { ...process.env, AGENT_DIR: root, PI_DIR: piDir, PI_NODE: process.execPath },
			})
			const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'))
			expect(manifest.extensions).toEqual([
				join(runtimeRoot, 'extensions', 'superhive-pi-truth'),
				'./extensions/custom',
			])
		} finally {
			rmSync(root, { recursive: true, force: true })
		}
	})
})
