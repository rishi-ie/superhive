/**
 * Privacy & Data settings — export, delete workspace data, retention, delete account.
 */
import { useState } from 'react';
import { SettingSection } from './shared/SettingSection';
import { SettingRow } from './shared/SettingRow';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmationModal } from '@/components/right-auxiliary/shared';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import { listWorkspaces, deleteWorkspace, deleteAllWorkspaces } from '@/data/workspaces/store';
import { Trash2 } from 'lucide-react';

const RETENTION_OPTIONS = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
  { value: -1, label: 'Forever' },
];


/**
 * Privacy & Data settings page — manage your data, exports, and account deletion.
 */
export function PrivacySettings() {
  const { settings, update, resetAll, exportJson } = useSettings();
  const toast = useToast();
  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState<string | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [, setTrigger] = useState(0);
  const workspaces = listWorkspaces();

  const handleExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'superhive-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    update('privacy', { exportDataLastRun: new Date().toISOString() });
    toast({ title: 'Settings exported successfully' });
  };

  const handleResetAll = () => {
    resetAll();
    toast({ title: 'All settings reset to defaults' });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Privacy & Data"
        description="Manage your data, exports, and privacy preferences."
      />

      <SettingSection
        title="Your Data"
        description="Export or delete data associated with your account."
      >
        <SettingRow
          label="Export settings"
          description="Download all your settings as a JSON file for backup or migration."
          control={
            <Button variant="outline" size="md" onClick={handleExport}>
              Export JSON
            </Button>
          }
        />
        <SettingRow
          label="Conversation retention"
          description="How long chat messages and agent conversations are stored before automatic deletion."
          control={
            <Select
              value={String(settings.privacy.conversationRetentionDays)}
              options={RETENTION_OPTIONS}
              onChange={val => update('privacy', { conversationRetentionDays: parseInt(val) })}
              className="w-40"
            />
          }
        />
      </SettingSection>

      <SettingSection
        title="Workspace Data"
        description="Delete all data within a specific workspace. This cannot be undone."
      >
        <div className="border border-border/40 rounded-md divide-y divide-border/40">
          {workspaces.map(ws => (
            <div key={ws.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-foreground">{ws.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{ws.id}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteWorkspace(ws.id)}
                className="text-chart-5 hover:text-chart-5 hover:bg-chart-5/10 gap-1.5"
              >
                <Trash2 size={12} />
                Delete
              </Button>
            </div>
          ))}
        </div>
      </SettingSection>

      <SettingSection title="Account" description="Account-level actions. These cannot be undone.">
        <SettingRow
          label="Reset all settings"
          description="Revert all settings to their default values. Your data is not affected."
          control={
            <Button variant="outline" size="md" onClick={handleResetAll}>
              Reset to defaults
            </Button>
          }
        />
        <SettingRow
          label="Delete account"
          description="Permanently delete your account and all associated data. This action is irreversible."
          control={
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowDeleteAccount(true)}
              className="border-chart-5/60 text-chart-5 hover:bg-chart-5/10 hover:border-chart-5"
            >
              Delete account
            </Button>
          }
        />
      </SettingSection>

      <ConfirmationModal
        open={showDeleteWorkspace !== null}
        title="Delete workspace data"
        description={`This will permanently delete all data for workspace "${showDeleteWorkspace ?? ''}". This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        confirmText={showDeleteWorkspace ?? undefined}
        onConfirm={async () => {
          const wsId = showDeleteWorkspace;
          setShowDeleteWorkspace(null);
          if (!wsId) return;
          const ok = await deleteWorkspace(wsId);
          if (ok) {
            toast({ title: `Workspace data deleted`, description: wsId });
            setTrigger(t => t + 1);
          } else {
            toast({ title: 'Error', description: 'Failed to delete workspace', type: 'error' });
          }
        }}
        onCancel={() => setShowDeleteWorkspace(null)}
      />

      <ConfirmationModal
        open={showDeleteAccount}
        title="Delete account"
        description="This will permanently delete your account and all associated data across all workspaces. This cannot be undone."
        confirmLabel="Delete my account"
        destructive
        confirmText="delete"
        onConfirm={async () => {
          setShowDeleteAccount(false);
          try {
            await window.electron.agents.terminateAll();
            await deleteAllWorkspaces();
            resetAll();
            setTrigger(t => t + 1);
            toast({ title: 'Account deleted', description: 'All data has been wiped.' });
          } catch (err) {
            toast({ title: 'Error', description: 'Failed to delete account', type: 'error' });
          }
        }}
        onCancel={() => setShowDeleteAccount(false)}
      />
      <div className="mt-6 flex justify-end">
        <ResetSection domain="privacy" />
      </div>
    </div>
  );
}
