/**
 * Workspaces settings — list, create, rename, archive workspaces + per-workspace data retention.
 */
import { useState } from 'react';
import { Plus, Archive, Pencil } from 'lucide-react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { IconButton } from '@/components/ui/IconButton';
import { TextInput } from '@/components/ui/TextInput';
import { ConfirmationModal } from '@/components/right-auxiliary/shared';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';

const RETENTION_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
  { value: -1, label: 'Forever' },
];


/**
 * Workspaces settings page — manage your organization's workspaces and data retention.
 */
export function WorkspacesSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const [showArchive, setShowArchive] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const workspaces = settings.workspaces.workspaces;

  const startEdit = (ws: typeof workspaces[0]) => {
    setEditingId(ws.id);
    setEditName(ws.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    update('workspaces', {
      workspaces: workspaces.map(w =>
        w.id === editingId ? { ...w, name: editName } : w
      ),
    });
    setEditingId(null);
    toast({ title: 'Workspace renamed' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const updateRetention = (workspaceId: string, days: number) => {
    update('workspaces', {
      workspaces: workspaces.map(w =>
        w.id === workspaceId ? { ...w, dataRetentionDays: days } : w
      ),
    });
  };

  const archiveWorkspace = (_id: string) => {
    toast({ title: `Workspace archived` });
    setShowArchive(null);
  };

  const handleCreate = () => {
    const id = `ws-${Date.now()}`;
    update('workspaces', {
      workspaces: [
        ...workspaces,
        {
          id,
          name: 'New Workspace',
          dataRetentionDays: 90,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    toast({ title: 'Workspace created' });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-4 pb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Workspaces</h2>
          <p className="mt-2 text-sm text-muted-foreground">Manage your organization's workspaces and data retention policies.</p>
        </div>
        <Button variant="solid" size="md" onClick={handleCreate} className="gap-1.5 shrink-0">
          <Plus size={14} />
          New workspace
        </Button>
      </div>

      <SettingSection
        title="Workspaces"
        description="Each workspace is an isolated environment with its own agents, channels, and tickets."
      >
        <div className="border border-border/40 rounded-md divide-y divide-border/40">
          {workspaces.map(ws => (
            <div key={ws.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  {editingId === ws.id ? (
                    <div className="flex items-center gap-2">
                      <TextInput
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                        className="max-w-xs"
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <Button variant="solid" size="sm" onClick={saveEdit}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{ws.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{ws.id}</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(ws.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {editingId !== ws.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(ws)}
                      aria-label={`Rename ${ws.name}`}
                    >
                      <Pencil size={13} />
                    </IconButton>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowArchive(ws.id)}
                      aria-label={`Archive ${ws.name}`}
                      className="text-muted-foreground hover:text-chart-5"
                    >
                      <Archive size={13} />
                    </IconButton>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border/30">
                <SettingRow
                  label="Data retention"
                  description="How long conversation and activity data is kept before automatic deletion."
                  control={
                    <Select
                      value={String(ws.dataRetentionDays)}
                      options={RETENTION_OPTIONS}
                      onChange={val => updateRetention(ws.id, parseInt(val))}
                      className="w-36"
                    />
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </SettingSection>

      {showArchive && (
        <ConfirmationModal
          title="Archive workspace"
          description={`This will archive "${showArchive}". Archived workspaces are not deleted but are deactivated. This can be undone.`}
          confirmLabel="Archive"
          destructive
          confirmText={showArchive}
          onConfirm={() => archiveWorkspace(showArchive)}
          onCancel={() => setShowArchive(null)}
        />
      )}
    </div>
  );
}
