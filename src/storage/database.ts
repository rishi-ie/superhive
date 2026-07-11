import { JSONFilePreset } from 'lowdb/node'

let userDataPath: string | null = null

export function setUserDataPath(path: string): void {
	userDataPath = path
}

// LowDB v7's JSONFile.write() uses a static `{file}.tmp` filename for the
// atomic-rename write. When two writes to the same file happen in rapid
// succession (e.g. agents.create immediately followed by runtime.start ->
// AgentRepository.update during project creation), the second write's tmp
// file collides with the first, causing ENOENT on rename.
//
// This per-file write queue serializes .write() calls per absolute path so
// only one write touches the .tmp at a time. Reads are unaffected.
const writeQueues = new Map<string, Promise<void>>()

async function queuedWrite(filePath: string, write: () => Promise<void>): Promise<void> {
	const prev = writeQueues.get(filePath) ?? Promise.resolve()
	const next = prev.then(() => write(), () => write())
	writeQueues.set(filePath, next)
	try {
		await next
	} finally {
		if (writeQueues.get(filePath) === next) {
			writeQueues.delete(filePath)
		}
	}
}

export async function loadDb<T>(filename: string, defaults: T) {
	if (!userDataPath) {
		throw new Error('User data path not set. Call setUserDataPath() first.')
	}
	const filePath = userDataPath + '/' + filename
	const low = await JSONFilePreset<T>(filePath, defaults)
	const originalWrite = low.write.bind(low)
	low.write = () => queuedWrite(filePath, originalWrite)
	return low
}
