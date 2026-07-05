export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-1",
    type: "user",
    timestamp: "10:30 AM",
    content: "Build the dashboard using shadcn components.",
  },
  {
    id: "msg-2",
    type: "assistant",
    timestamp: "10:30 AM",
    content: "Here's the complete dashboard implementation using shadcn components with proper dark theme styling.",
  },
];
