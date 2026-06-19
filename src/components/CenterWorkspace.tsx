import { useState } from 'react';
import { Breadcrumb } from './center-workspace/Breadcrumb';
import { TabStrip } from './center-workspace/TabStrip';
import { ChatEmptyState } from './center-workspace/ChatEmptyState';
import { ChatInput } from './center-workspace/ChatInput';
import { workspaceTabs } from '@/data/workspace-tabs';

export function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      <Breadcrumb segments={['Mumbrane', 'Manager']} branchName="main" />
      <TabStrip
        tabs={workspaceTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-y-auto flex flex-col">
        <ChatEmptyState />
      </div>

      <ChatInput />
    </div>
  );
}
