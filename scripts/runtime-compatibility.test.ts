import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'bun:test'
import { applyRuntimeCompatibility } from './runtime-compatibility'

test('patches the prepared truth extension for Pi native MiniMax routing', () => {
	const root = mkdtempSync(join(tmpdir(), 'superhive-runtime-compat-'))
	try {
		const target = join(root, 'extensions', 'superhive-pi-truth')
		cpSync(join(process.cwd(), '.runtime', 'extensions', 'superhive-pi-truth'), target, { recursive: true })
		const indexPath = join(target, 'index.ts')
		writeFileSync(indexPath, readFileSync(indexPath, 'utf8').replace(
			'\t\t).finally(() => {\n\t\t\tpi.setThinkingLevel(four.settings.runtime?.thinkingLevel ?? four.settings.defaultThinkingLevel ?? "medium");\n\t\t});\n\t} else {\n\t\tpi.setThinkingLevel(four.settings.runtime?.thinkingLevel ?? four.settings.defaultThinkingLevel ?? "medium");\n\t}',
			'\t\t);\n\t}',
		))
		applyRuntimeCompatibility(root)
		applyRuntimeCompatibility(root)
		expect(readFileSync(join(target, 'provider-map.ts'), 'utf8')).toContain('minimax: "anthropic-messages"')
		const applier = readFileSync(join(target, 'applier.ts'), 'utf8')
		expect(applier).toContain('applyModel(next.model, next.providers, ctx)')
		expect(applier).toContain('baseUrl: providers?.[target.provider]?.baseUrl ?? undefined')
		const index = readFileSync(join(target, 'index.ts'), 'utf8')
		expect(index).toContain('four.settings.providers,')
		expect(index).toContain('pi.setThinkingLevel(four.settings.runtime?.thinkingLevel ?? four.settings.defaultThinkingLevel ?? "medium")')
	} finally {
		rmSync(root, { recursive: true, force: true })
	}
})
