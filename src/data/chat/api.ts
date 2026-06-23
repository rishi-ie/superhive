import type { ChatThread } from './interface';

interface ChatApi {
  list(): Promise<ChatThread[]>;
  getCurrent(): Promise<ChatThread | undefined>;
}

export const chatApi: ChatApi = {
  list() {
    throw new Error('Not implemented — replace with real API call');
  },
  getCurrent() {
    throw new Error('Not implemented — replace with real API call');
  },
};
