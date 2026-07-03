export interface ChatThread {
  id: string;
  title: string;
  scope: string;
  scopeId: string;
  createdAt: string;
}
export interface Message {
  id: string;
  threadId: string;
  role: string;
  content: string;
  createdAt: string;
}
export interface ChatQuickStartItem {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}
