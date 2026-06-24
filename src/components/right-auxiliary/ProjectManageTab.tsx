import { useState } from 'react';
import { X } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Project, ProjectAgent } from '@/data/projects/store';

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
      <div className="space-y-2">
        <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-transparent border-0 rounded-md px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring hover:bg-white/5 transition-colors"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] tracking-wider font-medium text-muted-foreground">
          Members ({members.length})
        </label>
        <div className="space-y-1">
          {members.map(agent => (
            <div
              key={agent.id}
              className="group flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors cursor-default"
            >
              <div className="size-5 rounded-full bg-chart-2 flex items-center justify-center text-[8px] font-bold text-sidebar-primary-foreground shrink-0">
                {agent.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground truncate">{agent.name}</div>
                <div className="text-[9px] text-muted-foreground truncate">{agent.role}</div>
              </div>
              <button
                onClick={() => removeMember(agent.id)}
                type="button"
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              >
                <X size={12} strokeWidth={STROKE_WIDTH} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] tracking-wider font-medium text-muted-foreground">
          Channels ({channels.length})
        </label>
        <div className="space-y-1">
          {channels.slice(0, 5).map(channel => (
            <div
              key={channel.id}
              className="group flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-white/5 transition-colors cursor-default"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground truncate">{channel.topic}</div>
                <div className="text-[9px] text-muted-foreground">{channel.id}</div>
              </div>
              <button
                onClick={() => removeChannel(channel.id)}
                type="button"
                className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              >
                <X size={12} strokeWidth={STROKE_WIDTH} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/40 pt-3 space-y-2">
        <button
          type="button"
          className="w-full rounded-md border border-border/40 px-3 py-2 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
        >
          Archive Project
        </button>
      </div>
    </div>
  );
}
