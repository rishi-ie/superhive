/**
 * Project management tab — title, members, channels, and archive/unarchive controls.
 */
import { useState } from 'react';
import { Archive, ArchiveRestore } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { SaveBar } from '@/components/ui/SaveBar';
import { Pill } from '@/components/ui/Pill';
import { ConfirmationModal } from './shared/ConfirmationModal';
import { useToast } from '@/lib/toast-context';
import { archiveProject, unarchiveProject } from '@/data/projects/store';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Project } from '@/data/projects/store';

type ProjectManageTabProps = {
  project: Project;
  onProjectsChanged?: () => void;
};

/**
 * Project management tab — title editor, members list, channels preview, archive/unarchive.
 * @param project - Project to manage
 * @param onProjectsChanged - Called after a mutation (archive/unarchive) so the parent can refresh derived data
 */
export function ProjectManageTab({ project, onProjectsChanged }: ProjectManageTabProps) {
  const [title, setTitle] = useState(project.title);
  const [members, setMembers] = useState(project.agents);
  const [channels, setChannels] = useState(project.channels);
  const [isDirty, setIsDirty] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
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
    const updated = archiveProject(project.id);
    setShowArchiveModal(false);
    if (updated) {
      toast({ title: 'Project archived', description: updated.title });
      onProjectsChanged?.();
    }
  };

  const handleUnarchiveConfirm = () => {
    const updated = unarchiveProject(project.id);
    setShowUnarchiveModal(false);
    if (updated) {
      toast({ title: 'Project restored', description: updated.title });
      onProjectsChanged?.();
    }
  };

  const isArchived = project.status === 'ARCHIVED';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        <div className="flex items-center justify-between">
          <Pill active={!isArchived} size="sm">
            {isArchived ? 'Archived' : 'Active'}
          </Pill>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Title</label>
          <TextInput
            value={title}
            onChange={e => markDirty(() => setTitle(e.target.value))}
          />
        </div>

        {project.description && (
          <div className="space-y-2">
            <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Brief</label>
            <p className="text-xs text-foreground whitespace-pre-wrap rounded-md border border-border/40 bg-card/30 p-2">
              {project.description}
            </p>
          </div>
        )}

        {project.successCriteria && (
          <div className="space-y-2">
            <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Success criteria</label>
            <p className="text-xs text-foreground whitespace-pre-wrap rounded-md border border-border/40 bg-card/30 p-2">
              {project.successCriteria}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] tracking-wider font-medium text-muted-foreground">
            Members ({members.length})
          </label>
          <div className="space-y-1">
            {members.map(agent => (
              <div
                key={agent.id}
                className="group flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-hover-tint transition-colors cursor-default"
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
                className="group flex items-center gap-2 p-2 rounded-md border border-border/40 hover:bg-hover-tint transition-colors cursor-default"
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
          {isArchived ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowUnarchiveModal(true)}
            >
              <ArchiveRestore size={14} strokeWidth={STROKE_WIDTH} />
              Unarchive Project
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowArchiveModal(true)}
            >
              <Archive size={14} strokeWidth={STROKE_WIDTH} />
              Archive Project
            </Button>
          )}
        </div>

      </div>

      <SaveBar
        onSave={handleSave}
        onCancel={handleCancel}
        disabled={!isDirty}
        variant="inline"
      />

      {showArchiveModal && (
        <ConfirmationModal
          open={showArchiveModal}
          title="Archive Project"
          description="Archive this project? It will move to the Archived section in the left sidebar."
          confirmLabel="Archive"
          destructive
          confirmText="ARCHIVE"
          onConfirm={handleArchiveConfirm}
          onCancel={() => setShowArchiveModal(false)}
        />
      )}

      {showUnarchiveModal && (
        <ConfirmationModal
          open={showUnarchiveModal}
          title="Unarchive Project"
          description="Restore this project to active status? It will reappear in default project views."
          confirmLabel="Unarchive"
          confirmText="UNARCHIVE"
          onConfirm={handleUnarchiveConfirm}
          onCancel={() => setShowUnarchiveModal(false)}
        />
      )}
    </div>
  );
}