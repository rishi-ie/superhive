import { useState } from 'react';
import { Breadcrumb } from './center-workspace/Breadcrumb';
import { TabStrip } from './center-workspace/TabStrip';
import { ChatEmptyState } from './center-workspace/ChatEmptyState';
import { ChatInput } from './center-workspace/ChatInput';
import { ChatThread } from './center-workspace/ChatThread';
import { ProjectsView } from './center-workspace/ProjectsView';
import { TicketsView } from './center-workspace/TicketsView';
import { workspaceTabs } from '@/data/workspace-tabs';
import { currentThread } from '@/data/mock/chat';

export function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState('chat');
  const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

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
        {activeTab === 'chat' && (USE_MOCK_DATA ? <ChatThread thread={currentThread} /> : <ChatEmptyState />)}
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'tickets' && <TicketsView />}
      </div>

      {isChat && <ChatInput />}
    </div>
  );
}