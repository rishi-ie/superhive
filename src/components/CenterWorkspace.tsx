import { useState } from 'react';
import { Breadcrumb } from './center-workspace/Breadcrumb';
import { TabStrip } from './center-workspace/TabStrip';
import { ChatEmptyState } from './center-workspace/ChatEmptyState';
import { ChatInput } from './center-workspace/ChatInput';
import { ChatThread } from './center-workspace/ChatThread';
import { ProjectsView } from './center-workspace/ProjectsView';
import { TicketsView } from './center-workspace/TicketsView';
import { workspaceTabs } from '@/data/workspace-tabs';
import { getCurrentThread } from '@/data/chat/store';

export function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState('chat');
  const currentThread = getCurrentThread();
  const isChat = activeTab === 'chat';

  return (
    <div className="flex h-full flex-1 flex-col min-w-0 bg-background">
      <div className="h-2 shrink-0" />
      <Breadcrumb segments={['Superhive', 'Workspace']} branchName="main" />
      <TabStrip
        tabs={workspaceTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chat' && (currentThread ? <ChatThread thread={currentThread} /> : <ChatEmptyState />)}
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'tickets' && <TicketsView />}
      </div>

      {isChat && <ChatInput />}
    </div>
  );
}
