export const AGENT = {
  name: "Pi Coding Agent",
  initials: "P",
  model: "Claude Opus 4",
  status: "running" as const,
};

export const SLASH_COMMANDS = [
  { name: "/plan", description: "Create a structured plan", icon: "MapIcon" },
  { name: "/code", description: "Generate or edit code", icon: "CodeIcon" },
  { name: "/fix", description: "Debug and fix an error", icon: "BugIcon" },
  { name: "/review", description: "Review code for issues", icon: "EyeIcon" },
  { name: "/refactor", description: "Improve code structure", icon: "RefreshCwIcon" },
  { name: "/explain", description: "Explain how something works", icon: "HelpCircleIcon" },
  { name: "/test", description: "Write or run tests", icon: "BeakerIcon" },
  { name: "/deploy", description: "Deploy to an environment", icon: "RocketIcon" },
  { name: "/document", description: "Generate documentation", icon: "FileTextIcon" },
  { name: "/search", description: "Search across files", icon: "SearchIcon" },
];

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  streaming?: boolean;
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
