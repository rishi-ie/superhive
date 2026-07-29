import type { ProjectChannelMessage, ProjectMessageReceipt } from '../domain/entities'

export interface ProjectConversationPage {
  messages: ProjectChannelMessage[]
  nextCursor?: string
}

export interface ProjectConversationStore {
  append(messages: ProjectChannelMessage[]): Promise<void>
  list(projectId: string, cursor?: string): Promise<ProjectConversationPage>
  appendReceipt(receipt: ProjectMessageReceipt): Promise<void>
}

