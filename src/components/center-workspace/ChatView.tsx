import { ChatEmptyState } from './ChatEmptyState';
import { ChatThread } from './ChatThread';
import { ChatInput } from './ChatInput';
import { OnboardingWizard } from './OnboardingWizard';
import { CHAT_WIZARD_CONFIG } from '@/data/wizard-configs';
import { listThreads } from '@/data/chat/store';
import type { OnboardingWizardProps } from './OnboardingWizard';

type ChatViewProps = {
  workspaceId: string;
  agentId?: string | null;
  onSend?: (message: string) => void;
  onAction?: OnboardingWizardProps['onAction'];
};

export function ChatView({ workspaceId, agentId, onSend, onAction }: ChatViewProps) {
  const threads = listThreads();
  const currentThread = threads[0] ?? null;

  return (
    <div className="flex flex-col h-full min-h-0">
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
