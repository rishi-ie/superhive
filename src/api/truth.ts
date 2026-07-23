import type {
	TruthFileEntry,
	TruthReadResult,
	TruthWriteInput,
	TruthWriteResult,
} from '@/types/electron'

export const truth = {
	listFiles: (agentId: string): Promise<TruthFileEntry[]> =>
		window.api.truth.listFiles(agentId),
	readFile: (agentId: string, extName: string): Promise<TruthReadResult | null> =>
		window.api.truth.readFile(agentId, extName),
	writeFile: (agentId: string, input: TruthWriteInput): Promise<TruthWriteResult> =>
		window.api.truth.writeFile(agentId, input),
}
