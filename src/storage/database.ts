import { JSONFilePreset } from 'lowdb/node'
import { queueWrite } from './queue-write'

let userDataPath: string | null = null

const handles = new Map<string, Awaited<ReturnType<typeof JSONFilePreset<unknown>>>>()

export function setUserDataPath(path: string): void {
	userDataPath = path
}

/**
 * Returns the userData directory set by `setUserDataPath`, or null if
 * not yet set. Used by Gap 2 mailbox IPC to read db.projects.json
 * synchronously without going through the async `loadDb` path. Cheap
 * because the path is set once at app boot.
 */
export function getUserDataPath(): string | null {
	return userDataPath
}

export async function loadDb<T>(filename: string, defaults: T) {
	if (!userDataPath) {
		throw new Error('User data path not set. Call setUserDataPath() first.')
	}
	const filePath = userDataPath + '/' + filename
	const cached = handles.get(filePath)
	if (cached) return cached as Awaited<ReturnType<typeof JSONFilePreset<T>>>
	const low = await JSONFilePreset<T>(filePath, defaults)
	const originalWrite = low.write.bind(low)
	low.write = (() => queueWrite(filePath, originalWrite)) as typeof low.write
	handles.set(filePath, low as Awaited<ReturnType<typeof JSONFilePreset<unknown>>>)
	return low
}

/**
 * Drop all cached lowdb handles. Test-only escape hatch so each test
 * can re-initialize against a fresh tmp dir via setUserDataPath.
 * Production code never calls this.
 */
export function __resetDbCache(): void {
	handles.clear()
}
