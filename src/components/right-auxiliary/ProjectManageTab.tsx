import { useState } from 'react';
import { X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { TextInput } from '@/components/ui/TextInput';
import type { Project, ProjectAgent, CommunicationChannel } from '@/data/projects/store';

type ProjectManageTabProps = {
  project: Project;
  availableAgents: ProjectAgent[];
};

export function ProjectManageTab({ project, availableAgents }: ProjectManageTabProps) {
  const [title, setTitle] = useState(project.title);
  const [members, setMembers] = useState(project.agents);
  const [channels, setChannels] = useState(project.channels);

  const removeMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));
  const removeChannel = (id: string) => setChannels(prev => prev.filter(c => c.id !== id));

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Title</label>
        <TextInput
          value={title}
          onChange={e => setTitle(e.target.value)}
          size="sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Members ({members.length})</label>
        <div className="space-y-1">
          {members.map(agent => (
            <div key={agent.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card">
              <div className="size-4 rounded-full bg-chart-2 flex items-center justify-center text-[8px] font-bold text-sidebar-primary-foreground shrink-0">
                {agent.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground truncate">{agent.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{agent.role}</div>
              </div>
              <button
                onClick={() => removeMember(agent.id)}
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} strokeWidth={STROKE_WIDTH} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Channels ({channels.length})</label>
        <div className="space-y-1">
          {channels.slice(0, 5).map(channel => (
            <div key={channel.id} className="flex items-center gap-2 p-2 rounded-md border border-border bg-card">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground truncate">{channel.topic}</div>
                <div className="text-[9px] text-muted-foreground">{channel.id}</div>
              </div>
              <button
                onClick={() => removeChannel(channel.id)}
                type="button"
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={12} strokeWidth={STROKE_WIDTH} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <button
          type="button"
          className="w-full rounded-md border border-border px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          Archive Project
        </button>
      </div>
    </div>
  );
}
