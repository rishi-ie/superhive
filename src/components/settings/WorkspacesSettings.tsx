/**
 * Workspaces settings — manage workspaces with a card-based layout.
 * Each workspace shows identity, data retention, and actions.
 */
import { useState } from 'react';
import { Plus, Pencil, Archive, Folder } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { getInitials } from '@/lib/initials';
import { SettingSection } from './shared/SettingSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { ResetSection } from './shared/ResetSection';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { TextInput } from '@/components/ui/TextInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { ConfirmationModal } from '@/modals/ConfirmationModal';
import { useToast } from '@/toasts/context';
import { listWorkspaces, createWorkspace, renameWorkspace, setRetention, archiveWorkspace } from '@/data/workspace/store';
import { spawnAgentStub } from '@/lib/agent-manager';
import type { Workspace } from '@/data/workspace/store';

const RETENTION_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
  { value: -1, label: 'Forever' },
];

const CHART_COLORS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'] as const;

function avatarColor(id: string): string {
  const idx = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % CHART_COLORS.length;
  return CHART_COLORS[idx] ?? 'chart-1';
}

const BG: Record<string, string> = {
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
};

/* ─── Workspace Card (horizontal list row) ──────────────────────────────── */

type WorkspaceCardProps = {
  workspace: Workspace;
  isDefault: boolean;
  onRetentionChange: (id: string, days: number) => void;
  onRename: (id: string, name: string) => void;
  onArchive: (id: string) => void;
};

function WorkspaceCard({ workspace, isDefault, onRetentionChange, onRename, onArchive }: WorkspaceCardProps) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(workspace.name);
  const [showArchive, setShowArchive] = useState(false);

  const color = avatarColor(workspace.id);
  const initials = getInitials(workspace.name);

  const startEdit = () => {
    setEditName(workspace.name);
    setEditing(true);
  };

  const saveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== workspace.name) {
      onRename(workspace.id, trimmed);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditName(workspace.name);
  };

  return (
    <>
      <Card className="bg-card">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 px-4 py-3">
            {/* Avatar */}
            <div
              className={`size-9 shrink-0 rounded-md ${BG[color] ?? 'bg-chart-1'} flex items-center justify-center text-[11px] font-bold text-sidebar-primary-foreground uppercase select-none`}
            >
              {initials}
            </div>

            {/* Name + id */}
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <TextInput
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    size="sm"
                    className="max-w-[200px]"
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  <Button variant="default" size="sm" onClick={saveEdit} className="h-7 px-2 text-[11px]">
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 px-2 text-[11px]">
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground truncate">{workspace.name}</span>
                  {isDefault && (
                    <Badge variant="active" className="text-[9px] shrink-0">
                      Default
                    </Badge>
                  )}
                </div>
              )}
              <span className="text-[10px] text-muted-foreground font-mono">{workspace.id}</span>
            </div>

            {/* Retention */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:block">Data retention</span>
              <Select
                value={String(workspace.retentionDays)}
                options={RETENTION_OPTIONS}
                onChange={val => onRetentionChange(workspace.id, parseInt(val))}
                className="w-32"
              />
            </div>

            {/* Actions */}
            {!editing && (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={startEdit} className="h-7 w-7 p-0">
                  <Pencil size={13} strokeWidth={STROKE_WIDTH} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchive(true)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-chart-5"
                >
                  <Archive size={13} strokeWidth={STROKE_WIDTH} />
                </Button>
              </div>
            )}
          </div>

          {/* Footer row */}
          <div className="px-4 pb-3 flex items-center gap-1.5 border-t border-border/30 pt-2">
            <span className="text-[10px] text-muted-foreground">
              Created {workspace.createdAt ? new Date(workspace.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal
        open={showArchive}
        title="Archive workspace"
        description={`"${workspace.name}" will be archived. Archived workspaces are not deleted but are deactivated. This can be undone.`}
        confirmLabel="Archive"
        destructive
        confirmText={workspace.name}
        onConfirm={() => {
          onArchive(workspace.id);
          setShowArchive(false);
        }}
        onCancel={() => setShowArchive(false)}
      />
    </>
  );
}

/* ─── Empty State ───────────────────────────────────────────────────────── */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
        <Folder size={20} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">No workspaces yet</p>
        <p className="text-xs text-muted-foreground max-w-48">
          Create your first workspace to start organizing agents, projects, and channels.
        </p>
      </div>
      <Button variant="default" size="sm" onClick={onCreate} className="gap-1.5 mt-1">
        <Plus size={13} strokeWidth={STROKE_WIDTH} />
        Create workspace
      </Button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function WorkspacesSettings() {
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [, setTrigger] = useState(0);

  const workspaces = listWorkspaces().filter(w => !w.archivedAt);
  const defaultId = listWorkspaces()[0]?.id;

  const handleRetentionChange = (id: string, days: number) => {
    setRetention(id, days);
    setTrigger(t => t + 1);
    toast({ title: 'Retention updated' });
  };

  const handleRename = (id: string, name: string) => {
    renameWorkspace(id, name);
    setTrigger(t => t + 1);
    toast({ title: 'Workspace renamed' });
  };

  const handleArchive = (id: string) => {
    archiveWorkspace(id);
    setTrigger(t => t + 1);
    toast({ title: 'Workspace archived' });
  };

  const handleCreate = () => {
    const trimmed = createName.trim();
    if (!trimmed) return;
    const ws = createWorkspace({ name: trimmed });
    if (!ws) return;
    spawnAgentStub({ kind: 'workspace', entityId: ws.id, name: 'Workspace Agent' });
    setTrigger(t => t + 1);
    setShowCreate(false);
    setCreateName('');
    toast({ title: 'Workspace created', description: trimmed });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Workspaces"
        description="Manage your organization's workspaces and data retention policies."
        action={
          <Button variant="default" size="md" onClick={() => setShowCreate(true)} className="gap-1.5 shrink-0">
            <Plus size={14} strokeWidth={STROKE_WIDTH} />
            New workspace
          </Button>
        }
      />

      <SettingSection
        title="Your workspaces"
        description="Each workspace is an isolated environment with its own agents, channels, and tickets."
      >
        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState onCreate={() => setShowCreate(true)} />
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {workspaces.map(ws => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                isDefault={ws.id === defaultId}
                onRetentionChange={handleRetentionChange}
                onRename={handleRename}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </SettingSection>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Give your workspace a name. You can rename it anytime.
            </DialogDescription>
          </DialogHeader>
          <TextInput
            value={createName}
            onChange={e => setCreateName(e.target.value)}
            placeholder="Workspace name"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreate(false);
                setCreateName('');
              }}
            >
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={handleCreate} disabled={!createName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-6 flex justify-end">
        <ResetSection domain="workspaces" />
      </div>
    </div>
  );
}
