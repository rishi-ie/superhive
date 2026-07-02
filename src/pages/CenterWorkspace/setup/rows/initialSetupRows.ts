/**
 * Row configuration for the initial no-workspace setup wizard.
 */
import { Plus, FolderPlus, Bot, Cpu, X } from 'lucide-react';
import type { MenuRow } from '../SetupMenuList';

export type InitialSetupActions = {
  onCreateWorkspace: () => void;
  onDismiss: () => void;
  onStub: (label: string) => () => void;
};

export function buildInitialSetupRows(actions: InitialSetupActions): MenuRow[] {
  return [
    {
      id: 'create-workspace',
      icon: Plus,
      label: 'Create your workspace',
      chord: { mac: 'Mod+N', default: 'Ctrl+N' },
      onClick: actions.onCreateWorkspace,
    },
    {
      id: 'add-project',
      icon: FolderPlus,
      label: 'Add a project to a workspace',
      chord: { mac: 'Mod+Shift+P', default: 'Ctrl+Shift+P' },
      onClick: actions.onStub('Add a project'),
    },
    {
      id: 'hire-agent',
      icon: Bot,
      label: 'Hire your first agent',
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
      id: 'skip',
      icon: X,
      label: 'Skip for now',
      chord: { mac: 'Esc', default: 'Esc' },
      onClick: actions.onDismiss,
    },
  ];
}
