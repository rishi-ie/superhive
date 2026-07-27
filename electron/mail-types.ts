export interface ProjectBlock {
	id: string
	name?: string
	description?: string
	localPath: string
	coordinatorAgentId?: string
	members: Array<{ agentId: string; [key: string]: unknown }>
}

export interface MailEvent {
	ts: number
	type: 'mail'
	direction: 'sent' | 'received' | 'acked'
	messageId: string
	fromAgentId: string
	toAgentId: string
	kind: 'request' | 'result' | 'question' | 'broadcast'
	projectId?: string
}
