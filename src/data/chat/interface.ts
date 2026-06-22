export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
};
