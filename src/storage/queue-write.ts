const writeQueues = new Map<string, Promise<void>>()

export async function queueWrite(filePath: string, write: () => Promise<void>): Promise<void> {
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
