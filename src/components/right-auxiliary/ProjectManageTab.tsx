/**
 * Project management tab — title, members, channels, and archive/unarchive controls.
 */
import { useState } from 'react';
import { Archive, ArchiveRestore, X, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { SaveBar } from '@/components/ui/SaveBar';
import { Pill } from '@/components/ui/Pill';
import { ConfirmationModal } from './shared/ConfirmationModal';
import { useToast } from '@/lib/toast-context';
import { archiveProject, unarchiveProject, patchProject, removeAgentFromProject, addAgentToProject } from '@/data/projects/store';
import { listAgents } from '@/data/agents/store';
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
  const [description, setDescription] = useState(project.description);
  const [successCriteria, setSuccessCriteria] = useState(project.successCriteria);
  const [members, setMembers] = useState(project.agents);
  const [channels, setChannels] = useState(project.channels);
  const [isDirty, setIsDirty] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showUnarchiveModal, setShowUnarchiveModal] = useState(false);
  const [agentToRemove, setAgentToRemove] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const toast = useToast();

  const markDirty = (updater: () => void) => {
    updater();
    setIsDirty(true);
  };

  const handleSave = () => {
    const updated = patchProject(project.id, { title, description, successCriteria });
    if (updated) {
      toast({ title: 'Saved', description: updated.title });
    } else {
      toast({ title: 'Error', description: 'Failed to save project' });
    }
    setIsDirty(false);
  };

  const handleCancel = () => {
    setTitle(project.title);
    setDescription(project.description);
    setSuccessCriteria(project.successCriteria);
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

  const handleRemoveAgentConfirm = () => {
    if (!agentToRemove) return;
    const removed = removeAgentFromProject(project.id, agentToRemove);
    setAgentToRemove(null);
    if (removed) {
      setMembers(prev => prev.filter(a => a.id !== removed.id));
      toast({ title: 'Agent removed', description: removed.name });
    } else {
      toast({ title: 'Error', description: 'Failed to remove agent' });
    }
  };

  const handleAddAgent = (agentId: string) => {
    const added = addAgentToProject(project.id, agentId);
    if (added) {
      setMembers(prev => [...prev, added]);
      setShowAddAgent(false);
      toast({ title: 'Agent added', description: added.name });
    } else {
      toast({ title: 'Could not add agent', type: 'error' });
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

        <div className="space-y-2">
          <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Brief</label>
          <textarea
            className="text-xs text-foreground whitespace-pre-wrap rounded-md border border-border/40 bg-card/30 p-2 w-full resize-none min-h-[60px] outline-none focus:ring-1 focus:ring-accent"
            value={description}
            onChange={e => markDirty(() => setDescription(e.target.value))}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] tracking-wider font-medium text-muted-foreground">Success criteria</label>
          <textarea
            className="text-xs text-foreground whitespace-pre-wrap rounded-md border border-border/40 bg-card/30 p-2 w-full resize-none min-h-[60px] outline-none focus:ring-1 focus:ring-accent"
            value={successCriteria}
            onChange={e => markDirty(() => setSuccessCriteria(e.target.value))}
            rows={3}
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
                <button
                  onClick={() => setAgentToRemove(agent.id)}
                  aria-label={`Remove ${agent.name} from project`}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-chart-5 transition-all p-1"
                >
                  <X size={12} strokeWidth={STROKE_WIDTH} />
                </button>
              </div>
            ))}
            {showAddAgent ? (
              <AddAgentPicker
                memberIds={new Set(members.map(a => a.id))}
                onPick={handleAddAgent}
                onCancel={() => setShowAddAgent(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddAgent(true)}
                className="w-full"
              >
                <Plus size={12} strokeWidth={STROKE_WIDTH} />
                Add agents
              </Button>
            )}
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

      <ConfirmationModal
        open={agentToRemove !== null}
        title="Remove agent from project"
        description={`Remove ${members.find(a => a.id === agentToRemove)?.name ?? 'this agent'} from this project? They can be re-added later. This will not delete the agent.`}
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemoveAgentConfirm}
        onCancel={() => setAgentToRemove(null)}
      />
    </div>
  );
}

function AddAgentPicker({
  memberIds,
  onPick,
  onCancel,
}: {
  memberIds: Set<string>;
  onPick: (agentId: string) => void;
  onCancel: () => void;
}) {
  const allAgents = listAgents();
  const candidates = allAgents.filter(a => !memberIds.has(a.id));
  return (
    <div className="rounded-md border border-border/40 p-2 space-y-1.5 bg-card/20">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-wider font-medium text-muted-foreground">Available agents</span>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cancel add"
        >
          <X size={11} strokeWidth={STROKE_WIDTH} />
        </button>
      </div>
      {candidates.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">All agents are already members.</p>
      ) : (
        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {candidates.map(agent => (
            <button
              key={agent.id}
              onClick={() => onPick(agent.id)}
              className="flex items-center gap-2 w-full p-1.5 rounded text-xs hover:bg-hover-tint text-left"
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}