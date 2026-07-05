import { ChatHeader } from "./components/ChatHeader";
import { MessageList } from "./components/MessageList";
import { ChatComposer } from "./components/ChatComposer";
import type { ChatMessage } from "./components/MessageBubble";

export type ViewCategory = "agent" | "project" | "hive" | "remote";

const CATEGORY_LABELS: Record<ViewCategory, string> = {
  agent: "Agent view",
  project: "Project view",
  hive: "Meta Hive",
  remote: "Remote",
};

const MOCK_AGENT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    name: "Code Reviewer",
    content:
      "Hi! I'm ready to review your code. Drop a PR link, paste a diff, or describe what you'd like me to look at.",
    timestamp: "10:00 AM",
  },
  {
    id: "2",
    role: "user",
    name: "You",
    content:
      "Review https://github.com/acme/web/pull/142 — focus on the auth flow in `src/auth/`",
    timestamp: "10:01 AM",
  },
  {
    id: "3",
    role: "assistant",
    name: "Code Reviewer",
    content: "Pulling the diff now...",
    timestamp: "10:01 AM",
    toolCalls: [{ name: "Read PR", target: "PR #142" }],
  },
  {
    id: "4",
    role: "assistant",
    name: "Code Reviewer",
    content:
      "I found **3 issues** worth addressing:\n\n**1. Missing input validation** — `src/auth/login.ts:24`\nNo check for empty email before trimming. Could cause a panic on malformed input.\n\n**2. Unhandled promise rejection** — `src/auth/session.ts:58`\n`fetchUser()` doesn't wrap its `await` in a try/catch. If the DB is down, this crashes the request handler.\n\n**3. Magic number** — `src/auth/config.ts:12`\n`tokenExpiry: 3600` should be a named constant like `TOKEN_EXPIRY_SECONDS`.\n\n---\n\nThe rest of the auth flow looks solid. Rate limiting and password hashing are well-implemented.",
    timestamp: "10:02 AM",
    toolCalls: [
      { name: "Read file", target: "src/auth/login.ts" },
      { name: "Read file", target: "src/auth/session.ts" },
      { name: "Read file", target: "src/auth/config.ts" },
    ],
  },
  {
    id: "5",
    role: "user",
    name: "You",
    content:
      "Fix issues 1 and 3, leave the promise rejection for now. Also can you add a rate limit config option?",
    timestamp: "10:03 AM",
    attachments: [
      { name: "login.ts", type: "text/plain" },
      { name: "config.ts", type: "text/plain" },
    ],
  },
  {
    id: "6",
    role: "assistant",
    name: "Code Reviewer",
    content:
      "On it. Here's what I'll do:\n\n1. Add input validation to `login.ts`\n2. Extract the magic number to a constant in `config.ts`\n3. Add a `rateLimit` config object with `windowMs` and `maxRequests` fields\n\nStarting now...",
    timestamp: "10:03 AM",
    toolCalls: [
      { name: "Apply fix", target: "login.ts" },
      { name: "Apply fix", target: "config.ts" },
    ],
  },
  {
    id: "7",
    role: "assistant",
    name: "Code Reviewer",
    content:
      "Done. Changes applied:\n\n**`src/auth/login.ts`** — line 24\n\nBefore:\n`const email = rawEmail.trim();`\n\nAfter:\n`if (!rawEmail || typeof rawEmail !== 'string') {\n  throw new ValidationError('email', 'Email is required');\n}\nconst email = rawEmail.trim();`\n\n**`src/auth/config.ts`** — added\n\n`export const TOKEN_EXPIRY_SECONDS = 3600;`\n\n`rateLimit: {\n  windowMs: 15 * 60 * 1000,\n  maxRequests: 100,\n}`\n\nWant me to commit these changes?",
    timestamp: "10:04 AM",
  },
  {
    id: "8",
    role: "user",
    name: "You",
    content:
      "yes please commit with the message 'fix: auth input validation and extract magic numbers'",
    timestamp: "10:05 AM",
  },
  {
    id: "9",
    role: "assistant",
    name: "Code Reviewer",
    content:
      "Committed! \n\nBranch: `fix/auth-validation` -> `main`\nSHA: `a3f9d21`\n\n> fix: auth input validation and extract magic numbers\n\nLet me know if you need anything else.",
    timestamp: "10:05 AM",
    toolCalls: [{ name: "Commit", target: "a3f9d21" }],
  },
];

export interface ChatViewProps {
  category: ViewCategory;
  agentName?: string;
}

export function ChatView({ category, agentName }: ChatViewProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      <ChatHeader
        categoryLabel={CATEGORY_LABELS[category]}
        agentName={agentName ?? "Untitled"}
        sessionName="Review auth flow PR #142"
      />
      <MessageList messages={MOCK_AGENT_MESSAGES} />
      <ChatComposer model="Composer 2.5 Pro" />
    </div>
  );
}
