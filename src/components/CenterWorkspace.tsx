import { useState } from 'react';
import { Breadcrumb } from './center-workspace/Breadcrumb';
import { TabStrip } from './center-workspace/TabStrip';
import { ModelToolbar } from './center-workspace/ModelToolbar';
import { NewChatAccordion, ChatEmptyState } from './center-workspace/NewChatAccordion';
import { ChatInput } from './center-workspace/ChatInput';
import { workspaceTabs } from '@/data/workspace-tabs';

export function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState('chat');
  const [activeModel, setActiveModel] = useState('claude');

  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      <Breadcrumb segments={['whispering-list', 'whispering-list']} branchName="whispering-list" />
      <TabStrip
        tabs={workspaceTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ModelToolbar activeModel={activeModel} onModelChange={setActiveModel} />

      <div className="flex-1 overflow-y-auto flex flex-col">
        <NewChatAccordion title="New Chat" />
        <ChatEmptyState title="Start a conversation" />
      </div>

      <ChatInput />
    </div>
  );
}
