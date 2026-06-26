/**
 * Project management tab — title, members, and channels with save/cancel.
 */
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { SaveCancelBar } from './shared/SaveCancelBar';
import { ConfirmationModal } from './shared/ConfirmationModal';
import { useToast } from '@/lib/toast-context';
import type { Project } from '@/data/projects/store';

type ProjectManageTabProps = {
  project: Project;
};

/**
 * Project management tab — title, members, and channels with save/cancel.
 * @param project - Project to manage
 */
export function ProjectManageTab({ project }: ProjectManageTabProps) {
  const [title, setTitle] = useState(project.title);
  const [members, setMembers] = useState(project.agents);
  const [channels, setChannels] = useState(project.channels);
  const [isDirty, setIsDirty] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const toast = useToast();

  const markDirty = (updater: () => void) => {
    updater();
    setIsDirty(true);
  };

  const handleSave = () => {
    toast({ title: 'Saved', description: project.title });
    setIsDirty(false);
  };

  const handleCancel = () => {
    setTitle(project.title);
    setMembers(project.agents);
    setChannels(project.channels);
    setIsDirty(false);
  };

  const handleArchiveConfirm = () => {
    setShowArchiveModal(false);
    toast({ title: 'Project archived', description: project.title });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        <div className="space-y-2">
          <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Title</label>
          <TextInput
            value={title}
            onChange={e => markDirty(() => setTitle(e.target.value))}
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
                <Avatar
                  name={agent.name}
                  size="xs3"
                  color="bg-chart-2"
                  className="font-bold text-sidebar-primary-foreground"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground truncate">{agent.name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{agent.role}</div>
                </div>
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
                  <div className="text-[9px] text-muted-foreground">{channel.id} · {channel.lastMessagePreview}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border/40 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowArchiveModal(true)}
          >
            Archive Project
          </Button>
        </div>

      </div>

      <SaveCancelBar
        onSave={handleSave}
        onCancel={handleCancel}
        disabled={!isDirty}
      />

      {showArchiveModal && (
        <ConfirmationModal
          open={showArchiveModal}
          title="Archive Project"
          description="Archive this project? It will be hidden from default views."
          confirmLabel="Archive"
          destructive
          confirmText="ARCHIVE"
          onConfirm={handleArchiveConfirm}
          onCancel={() => setShowArchiveModal(false)}
        />
      )}
    </div>
  );
}
