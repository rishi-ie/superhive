import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { OnboardingWizard } from './OnboardingWizard';
import { CHAT_WIZARD_CONFIG } from '@/data/wizard-configs';
import { listThreads, getCurrentThread } from '@/data/chat/store';
import { getAgent } from '@/data/agents/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

type ChatViewProps = {
  workspaceId: string;
  agentId?: string | null;
  onSend?: (message: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

export function ChatView({ workspaceId, agentId, onSend, onAction }: ChatViewProps) {
  const threads = listThreads();
  const currentThread = getCurrentThread();
  const agent = agentId ? getAgent(agentId) : null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {agent && (
        <div className="shrink-0 px-4 py-2 border-b border-border/40">
          <span className="text-xs text-muted-foreground">Chatting with </span>
          <span className="text-xs font-semibold text-foreground">{agent.name}</span>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        {currentThread ? (
          <ChatThread thread={currentThread} />
        ) : (
          <OnboardingWizard config={CHAT_WIZARD_CONFIG} onAction={onAction} />
        )}
      </div>
      <ChatInput onSubmit={onSend} />
    </div>
  );
}
