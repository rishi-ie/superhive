/**
 * Workflows & Triggers — list saved workflows and configure schedule triggers.
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/toasts/context';
import { formatRelativeTime } from '@/lib/relative-time';

const CRON_HELP = 'Cron expression: minute hour day month weekday. Example: "0 9 * * 1-5" = 9am Mon–Fri.';


/**
 * Workflows & Triggers page — manage scheduled and triggered workflows.
 */
export function WorkflowsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const workflows = settings.workflows.workflows;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCron, setEditCron] = useState('');
  const [editName, setEditName] = useState('');

  const startEdit = (wf: typeof workflows[0]) => {
    setEditingId(wf.id);
    setEditCron(wf.cronExpression);
    setEditName(wf.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    update('workflows', {
      workflows: workflows.map(w =>
        w.id === editingId ? { ...w, cronExpression: editCron, name: editName } : w
      ),
    });
    setEditingId(null);
    toast({ title: 'Workflow saved' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCron('');
    setEditName('');
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Workflows & Triggers"
        description="Manage automated workflows and their schedules."
      />

      <SettingSection
        title="Saved Workflows"
        description="Your configured workflows. Click Configure to edit a workflow's name or schedule."
      >
        {workflows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border/40 rounded-md">
            No workflows configured.
          </p>
        ) : (
          <div className="border border-border/40 rounded-md divide-y divide-border/40">
            {workflows.map(wf => (
              <div key={wf.id} className="px-4 py-3">
                {editingId === wf.id ? (
                  <div className="space-y-3">
                    <SettingRow
                      label="Name"
                      description="A friendly name for this workflow."
                    control={
                          <TextInput
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="max-w-xs"
                          />
                        }
                    />
                    <SettingRow
                      label="Cron expression"
                      description={CRON_HELP}
                      control={
                          <TextInput
                            value={editCron}
                            onChange={e => setEditCron(e.target.value)}
                            placeholder="0 9 * * 1-5"
                            className="w-44 font-mono"
                          />
                        }
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                      <Button variant="default" size="sm" onClick={saveEdit}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground truncate">{wf.name}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">{wf.cronExpression}</span>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="text-xs text-muted-foreground">
                          {wf.lastRun ? `Last run ${formatRelativeTime(wf.lastRun)}` : 'Never run'}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(wf)} className="shrink-0">
                      Configure
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SettingSection>
      <div className="mt-6 flex justify-end">
        <ResetSection domain="workflows" />
      </div>
    </div>
  );
}
