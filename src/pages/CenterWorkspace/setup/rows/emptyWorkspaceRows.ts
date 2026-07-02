/**
 * Row configuration for the empty-workspace ready wizard.
 */
import { FolderPlus, Bot, Cpu, Settings, X } from 'lucide-react';
import type { MenuRow } from '../SetupMenuList';

export type EmptyWorkspaceActions = {
  onDismiss: () => void;
  onOpenSettings: () => void;
  onStub: (label: string) => () => void;
  onCreateProject: () => void;
};

export function buildEmptyWorkspaceRows(actions: EmptyWorkspaceActions): MenuRow[] {
  return [
    {
      id: 'create-project',
      icon: FolderPlus,
      label: 'Create a project',
      chord: { mac: 'Mod+Shift+P', default: 'Ctrl+Shift+P' },
      onClick: () => {
        actions.onCreateProject();
        actions.onDismiss();
      },
    },
    {
      id: 'hire-agent',
      icon: Bot,
      label: 'Hire an agent',
      chord: { mac: 'Mod+Shift+A', default: 'Ctrl+Shift+A' },
      onClick: actions.onStub('Hire an agent'),
    },
    {
      id: 'configure-models',
      icon: Cpu,
      label: 'Configure models',
      chord: { mac: 'Mod+M', default: 'Ctrl+M' },
      onClick: actions.onStub('Configure models'),
    },
    {
      id: 'workspace-settings',
      icon: Settings,
      label: 'Tweak workspace settings',
      chord: { mac: 'Mod+,', default: 'Ctrl+,' },
      onClick: () => {
        actions.onOpenSettings();
        actions.onDismiss();
      },
    },
    {
      id: 'skip',
      icon: X,
      label: 'Skip for now',
      chord: { mac: 'Esc', default: 'Esc' },
      onClick: actions.onDismiss,
    },
  ];
}
