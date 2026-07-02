/**
 * Integrations settings — connect/disconnect providers, add/remove channels.
 * Real page replacing the sidebar "Coming soon" placeholder.
 */
import { useState } from 'react';
import {
  GitBranch, MessageSquare, Hash, FileText, Workflow, Webhook,
  Plus, X, Link2, Unlink, Check,
} from 'lucide-react';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { SettingSection } from './shared/SettingSection';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { Pill } from '@/components/ui/Pill';
import { ConfirmationModal } from '@/modals/ConfirmationModal';
import { useToast } from '@/toasts/context';
import {
  listIntegrations,
  connectIntegration,
  disconnectIntegration,
  listChannels,
  addChannel,
  removeChannel,
} from '@/data/integration/store';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Integration, IntegrationProvider } from '@/data/integration/store';
import type { LucideIcon } from 'lucide-react';

type ProviderMeta = {
  provider: IntegrationProvider;
  label: string;
  Icon: LucideIcon;
  needsBaseUrl: boolean;
  defaultBaseUrl: string;
  events: string[];
};

const PROVIDER_META: ProviderMeta[] = [
  {
    provider: 'github',
    label: 'GitHub',
    Icon: GitBranch,
    needsBaseUrl: true,
    defaultBaseUrl: 'https://api.github.com',
    events: ['push', 'pull_request', 'issues', 'release'],
  },
  {
    provider: 'slack',
    label: 'Slack',
    Icon: MessageSquare,
    needsBaseUrl: false,
    defaultBaseUrl: '',
    events: ['message', 'mention', 'reaction'],
  },
  {
    provider: 'linear',
    label: 'Linear',
    Icon: Hash,
    needsBaseUrl: true,
    defaultBaseUrl: 'https://api.linear.app/graphql',
    events: ['issue.create', 'issue.update', 'comment.create'],
  },
  {
    provider: 'notion',
    label: 'Notion',
    Icon: FileText,
    needsBaseUrl: true,
    defaultBaseUrl: 'https://api.notion.com',
    events: ['page.create', 'page.update', 'database.update'],
  },
  {
    provider: 'jira',
    label: 'Jira',
    Icon: Workflow,
    needsBaseUrl: true,
    defaultBaseUrl: 'https://your-domain.atlassian.net',
    events: ['issue.created', 'issue.updated', 'sprint.started'],
  },
  {
    provider: 'webhook',
    label: 'Webhook',
    Icon: Webhook,
    needsBaseUrl: true,
    defaultBaseUrl: '',
    events: ['custom'],
  },
];

/**
 * Integrations settings — manage provider connections and channels.
 */
export function IntegrationsSettings() {
  const [, setTrigger] = useState(0);
  const refresh = () => setTrigger(t => t + 1);

  const integrations = listIntegrations();
  const integrationByProvider = new Map(integrations.map(i => [i.provider, i] as const));

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Integrations"
        description="Connect third-party providers and route events into your swarm."
      />

      <SettingSection
        title="Providers"
        description="Connect a provider to enable event ingestion and outbound actions."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROVIDER_META.map(meta => (
            <ProviderCard
              key={meta.provider}
              meta={meta}
              integration={integrationByProvider.get(meta.provider)}
              onChanged={refresh}
            />
          ))}
        </div>
      </SettingSection>
    </div>
  );
}

function ProviderCard({
  meta,
  integration,
  onChanged,
}: {
  meta: ProviderMeta;
  integration: Integration | undefined;
  onChanged: () => void;
}) {
  const toast = useToast();
  const { Icon } = meta;
  const connected = integration?.connected ?? false;

  const [editing, setEditing] = useState(false);
  const [apiKey, setApiKey] = useState(integration?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(integration?.baseUrl ?? meta.defaultBaseUrl);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [addingChannel, setAddingChannel] = useState(false);

  const channels = integration ? listChannels(integration.id) : [];

  const handleConnect = () => {
    if (!integration) return;
    if (!apiKey.trim()) {
      toast({ title: 'API key required', type: 'error' });
      return;
    }
    connectIntegration(integration.id, apiKey.trim(), meta.needsBaseUrl ? baseUrl.trim() || null : null, {});
    toast({ title: `${meta.label} connected` });
    setEditing(false);
    onChanged();
  };

  const handleDisconnect = () => {
    if (!integration) return;
    disconnectIntegration(integration.id);
    toast({ title: `${meta.label} disconnected` });
    setConfirmDisconnect(false);
    onChanged();
  };

  const handleAddChannel = () => {
    if (!integration) return;
    const name = newChannelName.trim();
    if (!name) return;
    addChannel(integration.id, name, meta.events);
    setNewChannelName('');
    setAddingChannel(false);
    toast({ title: 'Channel added', description: name });
    onChanged();
  };

  return (
    <div className="rounded-md border border-border/40 bg-card/30 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-tertiary/40">
          <Icon size={16} strokeWidth={STROKE_WIDTH} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{meta.label}</div>
          <div className="text-[10px] text-muted-foreground">
            {connected ? `${channels.length} channel${channels.length !== 1 ? 's' : ''}` : 'Not connected'}
          </div>
        </div>
        <Pill active={connected} size="sm">
          {connected ? 'Connected' : 'Disconnected'}
        </Pill>
      </div>

      {!connected && !editing && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setEditing(true)}
        >
          <Link2 size={12} strokeWidth={STROKE_WIDTH} />
          Connect
        </Button>
      )}

      {editing && (
        <div className="space-y-2">
          <TextInput
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="API key or token"
            type="password"
          />
          {meta.needsBaseUrl && (
            <TextInput
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="Base URL (optional)"
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleConnect} className="flex-1">
              <Check size={12} strokeWidth={STROKE_WIDTH} />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {connected && !editing && (
        <>
          <div className="space-y-1">
            {channels.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">No channels yet</p>
            ) : (
              channels.map(ch => (
                <div
                  key={ch.id}
                  className="group flex items-center gap-2 p-1.5 rounded text-xs hover:bg-hover-tint"
                >
                  <span className="flex-1 truncate text-foreground">{ch.name}</span>
                  <span className="text-[9px] text-muted-foreground">{ch.events.length} events</span>
                  <button
                    onClick={() => { removeChannel(ch.id); onChanged(); }}
                    aria-label={`Remove ${ch.name}`}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-chart-5 transition-all"
                  >
                    <X size={11} strokeWidth={STROKE_WIDTH} />
                  </button>
                </div>
              ))
            )}
          </div>

          {addingChannel ? (
            <div className="flex gap-2">
              <TextInput
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="Channel name"
                className="flex-1"
                autoFocus
              />
              <Button size="sm" onClick={handleAddChannel}>
                <Check size={12} strokeWidth={STROKE_WIDTH} />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingChannel(false)}>
                <X size={12} strokeWidth={STROKE_WIDTH} />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAddingChannel(true)}
            >
              <Plus size={12} strokeWidth={STROKE_WIDTH} />
              Add channel
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setConfirmDisconnect(true)}
            >
              <Unlink size={12} strokeWidth={STROKE_WIDTH} />
              Disconnect
            </Button>
          </div>
        </>
      )}

      <ConfirmationModal
        open={confirmDisconnect}
        title={`Disconnect ${meta.label}?`}
        description={`This will remove your ${meta.label} connection and stop event ingestion. You can reconnect later.`}
        confirmLabel="Disconnect"
        destructive
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </div>
  );
}
