import { useState } from 'react';
import { Breadcrumb } from './center-workspace/Breadcrumb';
import { TabStrip } from './center-workspace/TabStrip';
import { ChatEmptyState } from './center-workspace/ChatEmptyState';
import { ChatInput } from './center-workspace/ChatInput';
import { ChatThread } from './center-workspace/ChatThread';
import { workspaceTabs } from '@/data/workspace-tabs';
import { currentThread } from '@/data/mock/chat';

export function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState('chat');
  const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      <Breadcrumb segments={['Superhive', 'Workspace']} branchName="main" />
      <TabStrip
        tabs={workspaceTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-y-auto flex flex-col">
        {USE_MOCK_DATA ? <ChatThread thread={currentThread} /> : <ChatEmptyState />}
      </div>

      <ChatInput />
    </div>
  );
}
