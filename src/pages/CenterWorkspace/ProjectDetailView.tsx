/**
 * Single project detail with stats, execution stream, swarm roster, communications, and OKF sidebar.
 */
import { useState } from 'react';
import { ExecutionStream } from './ExecutionStream';
import { SwarmRoster } from './SwarmRoster';
import { Communications } from './Communications';
import { OkfSidebar } from './OkfSidebar';
import { OkfConceptView } from './OkfConceptView';
import { OkfConceptEditor } from './OkfConceptEditor';
import { EmptyState } from '@/pages/RightAuxiliary/shared/EmptyState';
import { Layers } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Project } from '@/data/project/store';
import { StatCard } from '@/components/ui/StatCard';

type ProjectDetailViewProps = {
  project?: Project | null;
  onTicketSelect?: (id: string) => void;
  onAgentClick?: (id: string) => void;
  onChannelClick?: (id: string, workspaceId: string) => void;
  onOpenTickets?: () => void;
};

/**
 * @param project - Project to display (null shows empty state)
 * @param onTicketSelect - Called when a ticket is selected
 * @param onAgentClick - Called when an agent is clicked
 * @param onChannelClick - Called when a channel is clicked
 * @param onOpenTickets - Called when "open tickets" is clicked
 */
export function ProjectDetailView({
  project,
  onTicketSelect,
  onAgentClick,
  onChannelClick,
  onOpenTickets,
}: ProjectDetailViewProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  if (!project) {
    return (
      <EmptyState
        icon={<Layers size={32} strokeWidth={STROKE_WIDTH} />}
        title="No project selected"
        description="Select a project from the sidebar to view its details"
      />
    );
  }

  const executing = project.tickets.filter(t => t.status === 'EXECUTING').length;
  const activeAgents = project.agents.filter(a => a.currentStatus === 'WORKING' || a.currentStatus === 'COMPILING').length;
  const openChannels = project.channels.filter(c => c.status === 'OPEN').length;

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <div className="flex-1 flex flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-col gap-4 p-4 flex-1">
          <h1 className="text-lg font-bold text-foreground">{project.title}</h1>

          <div className="flex gap-2">
            <div className="flex-1"><StatCard label="Total Tickets" value={project.tickets.length} /></div>
            <div className="flex-1"><StatCard label="Executing" value={executing} color="text-chart-2" /></div>
            <div className="flex-1"><StatCard label="Active Agents" value={activeAgents} color="text-chart-2" /></div>
            <div className="flex-1"><StatCard label="Open Channels" value={openChannels} /></div>
          </div>

          <ExecutionStream
            tickets={project.tickets}
            agents={project.agents}
            onTicketSelect={onTicketSelect}
            onOpenTickets={onOpenTickets}
          />
          <div className="grid grid-cols-2 gap-4">
            <SwarmRoster
              agents={project.agents}
              onAgentClick={onAgentClick}
              onTicketClick={onTicketSelect}
            />
            <Communications
              channels={project.channels}
              agents={project.agents}
              onChannelClick={onChannelClick}
              onParticipantClick={onAgentClick}
              onTicketClick={onTicketSelect}
            />
          </div>
        </div>
      </div>
      <aside className="w-72 border-l border-border/40 flex flex-col">
        {activeFile ? (
          editing ? (
            <OkfConceptEditor
              projectId={project.id}
              path={activeFile}
              onClose={() => setEditing(false)}
              onSaved={() => { setEditing(false); setActiveFile(activeFile); }}
            />
          ) : (
            <OkfConceptView
              projectId={project.id}
              path={activeFile}
              onEdit={() => setEditing(true)}
            />
          )
        ) : (
          <div className="flex-1 overflow-y-auto">
            <OkfSidebar
              projectId={project.id}
              onFileSelect={(p) => { setActiveFile(p); setEditing(false); }}
              activeFile={activeFile}
            />
          </div>
        )}
        {activeFile && !editing && (
          <div className="border-t border-border/40">
            <button
              onClick={() => setActiveFile(null)}
              className="w-full px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground text-left"
            >
              ← Back to tree
            </button>
            <div className="max-h-40 overflow-y-auto">
              <OkfSidebar
                projectId={project.id}
                onFileSelect={(p) => { setActiveFile(p); setEditing(false); }}
                activeFile={activeFile}
              />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
