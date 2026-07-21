import { JSONFilePreset } from 'lowdb/node'
import { queueWrite } from './queue-write'

let userDataPath: string | null = null

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
	const low = await JSONFilePreset<T>(filePath, defaults)
	const originalWrite = low.write.bind(low)
	low.write = () => queueWrite(filePath, originalWrite)
	return low
}
