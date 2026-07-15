import { agents } from '@/api/agents';
import { toast } from 'sonner';

export interface RevealAgentResult {
	ok: boolean;
	error?: string;
}

export async function revealAgent(id: string): Promise<RevealAgentResult> {
	try {
		await agents.reveal(id);
		return { ok: true };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to reveal agent folder';
		toast.error(message);
		return { ok: false, error: message };
	}
}
