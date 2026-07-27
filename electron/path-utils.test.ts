import { homedir } from 'node:os'
import { describe, expect, test } from 'bun:test'
import { expandHome } from './path-utils'

describe('expandHome', () => {
	test('expands the platform home directory for slash paths', () => {
		expect(expandHome('~/projects')).toBe(`${homedir()}/projects`)
	})

	test('expands Windows-style home paths without changing other paths', () => {
		expect(expandHome('~\\projects')).toBe(`${homedir()}\\projects`)
		expect(expandHome('C:\\projects')).toBe('C:\\projects')
	})
})
