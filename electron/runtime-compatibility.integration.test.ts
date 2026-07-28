import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'bun:test'

test('prepared truth extension boots with Pi native MiniMax routing', async () => {
	const agentDir = mkdtempSync(join(tmpdir(), 'superhive-minimax-agent-'))
	let child: ReturnType<typeof spawn> | undefined
	try {
		cpSync(join(process.cwd(), '.runtime', 'extensions', 'superhive-pi-truth'), join(agentDir, 'extensions', 'superhive-pi-truth'), { recursive: true })
		cpSync(join(process.cwd(), '.runtime', 'extensions', 'superhive-pi-telemetry'), join(agentDir, 'extensions', 'superhive-pi-telemetry'), { recursive: true })
		writeFileSync(join(agentDir, 'manifest.json'), JSON.stringify({
			superhiveId: 'compat-test',
			version: 1,
			workspace: './workspace',
			extensions: ['./extensions/superhive-pi-truth', './extensions/superhive-pi-telemetry'],
		}))
		writeFileSync(join(agentDir, 'settings.json'), JSON.stringify({
			version: 1,
			managedBy: 'superhive-pi-truth@1#1',
			model: { provider: 'minimax', name: 'MiniMax-M3' },
			providers: { minimax: { apiKey: 'test-key', baseUrl: 'https://api.minimax.io/anthropic' } },
			defaultThinkingLevel: 'medium',
			runtime: { thinkingLevel: 'medium' },
		}))

		const state = await new Promise<{
			model?: { reasoning?: boolean }
			thinkingLevel?: string
		}>((resolve, reject) => {
			let stdout = ''
			let stderr = ''
			const timer = setTimeout(() => reject(new Error(`Timed out while booting Pi: ${stderr}`)), 8_000)
			let stateRequested = false
			child = spawn('node', [join(process.cwd(), 'runtime', 'agent-runner.mjs'), '--mode', 'rpc', '--no-session'], {
				cwd: agentDir,
				env: { ...process.env, PI_NODE: 'node', PI_DIR: join(process.cwd(), '.runtime', 'general-kai', 'pi'), AGENT_DIR: agentDir },
			})
			child.stdout?.on('data', (chunk: Buffer) => {
				stdout += chunk.toString('utf8')
				if (stdout.includes('Catalog:') && !stateRequested) {
					stateRequested = true
					child?.stdin?.write(`${JSON.stringify({ id: 'state', type: 'get_state' })}\n`)
				}
				for (const line of stdout.split('\n')) {
					try {
						const response = JSON.parse(line) as {
							id?: string
							success?: boolean
							data?: {
								model?: { reasoning?: boolean }
								thinkingLevel?: string
							}
						}
						if (response.id === 'state' && response.success && response.data) {
							clearTimeout(timer)
							resolve(response.data)
						}
					} catch {
						// Extension notifications and partial JSONL lines are ignored.
					}
				}
			})
			child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString('utf8') })
			child.once('error', (error) => {
				clearTimeout(timer)
				reject(error)
			})
		})
		expect(state.model?.reasoning).toBe(true)
		expect(state.thinkingLevel).toBe('medium')
	} finally {
		child?.kill('SIGTERM')
		rmSync(agentDir, { recursive: true, force: true })
	}
}, 12_000)
