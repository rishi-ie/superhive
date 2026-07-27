import { homedir } from 'node:os'

export function expandHome(input: string): string {
	if (input === '~') return homedir()
	return input.replace(/^~(?=[\\/])/, homedir())
}
