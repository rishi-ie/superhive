/**
 * Integrations settings — list of providers with master-detail panel.
 */
import { useState } from 'react';
import { GitBranch, Hash, FileText, Ticket, Webhook, Unplug, Plug, CheckCircle2 } from 'lucide-react';
import { SettingSection } from './shared/SettingSection';
import { ResetSection } from './shared/ResetSection';
import { SettingsPageHeader } from './shared/SettingsPageHeader';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent } from '@/components/ui/Card';
import { useSettings } from '@/lib/settings-context';
import { useToast } from '@/lib/toast-context';
import type { IntegrationProvider } from '@/data/settings/interface';

const PROVIDER_ICONS: Record<IntegrationProvider, React.ComponentType<{ size?: number; className?: string }>> = {
  github: GitBranch,
  slack: Hash,
  linear: Hash,
  notion: FileText,
  jira: Ticket,
  webhook: Webhook,
};

const PROVIDER_COLORS: Record<IntegrationProvider, string> = {
  github: 'text-white',
  slack: 'text-[#ecb22e]',
  linear: 'text-white',
  notion: 'text-white',
  jira: 'text-white',
  webhook: 'text-muted-foreground',
};

const PROVIDER_BG: Record<IntegrationProvider, string> = {
  github: 'bg-[#24292e]',
  slack: 'bg-[#4a154b]',
  linear: 'bg-[#5e6ad2]',
  notion: 'bg-[#000000]',
  jira: 'bg-[#0052cc]',
  webhook: 'bg-secondary',
};

const EVENT_OPTIONS = [
  'push',
  'pull_request',
  'issue',
  'issue_comment',
  'branch_created',
  'branch_deleted',
];

/**
 * Integrations settings page — connect and manage external integrations.
 */
export function IntegrationsSettings() {
  const { settings, update } = useSettings();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(settings.integrations.integrations[0]?.id ?? null);

  const integrations = settings.integrations.integrations;
  const selected = integrations.find(i => i.id === selectedId) ?? null;

  const toggleConnection = (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;
    if (!integration.connected) {
      toast({ title: `Connected to ${integration.label}` });
    } else {
      toast({ title: `Disconnected from ${integration.label}` });
    }
    update('integrations', {
      integrations: integrations.map(i =>
        i.id === id ? { ...i, connected: !i.connected } : i
      ),
    });
    if (selectedId === id && integrations.find(i => i.id === id)?.connected === false) {
      setSelectedId(null);
    }
  };

  const toggleChannelEvent = (integrationId: string, channelId: string, event: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;
    update('integrations', {
      integrations: integrations.map(i => {
        if (i.id !== integrationId) return i;
        return {
          ...i,
          channels: i.channels.map(ch => {
            if (ch.id !== channelId) return ch;
            return {
              ...ch,
              events: ch.events.includes(event)
                ? ch.events.filter(e => e !== event)
                : [...ch.events, event],
            };
          }),
        };
      }),
    });
  };

  return (
    <div className="flex flex-col">
      <SettingsPageHeader
        title="Integrations"
        description="Connect external tools and services to Superhive."
      />

      <div className="flex gap-6 -mx-1">
        {/* List */}
        <div className="w-60 shrink-0">
          <div className="space-y-1">
            {integrations.map(integration => {
              const Icon = PROVIDER_ICONS[integration.provider];
              const isSelected = selected?.id === integration.id;
              return (
                <button
                  key={integration.id}
                  type="button"
                  onClick={() => setSelectedId(integration.id)}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    isSelected
                      ? 'bg-sidebar-accent text-foreground'
                      : 'hover:bg-sidebar-accent/50 text-foreground/80'
                  }`}
                >
                  <div className={`size-8 rounded-md flex items-center justify-center shrink-0 ${PROVIDER_BG[integration.provider]}`}>
                    <Icon size={14} className={PROVIDER_COLORS[integration.provider]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">{integration.label}</span>
                    <span className={`text-[10px] flex items-center gap-1 ${integration.connected ? 'text-chart-2' : 'text-muted-foreground'}`}>
                      {integration.connected && <CheckCircle2 size={9} />}
                      {integration.connected ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="flex items-center justify-center h-64 border border-dashed border-border/40 rounded-md">
              <p className="text-sm text-muted-foreground">Select an integration to configure it.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <Card className="border-b border-border/40 rounded-b-none">
                <CardContent className="p-0 pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`size-11 rounded-lg flex items-center justify-center ${PROVIDER_BG[selected.provider]}`}>
                        {(() => {
                          const Icon = PROVIDER_ICONS[selected.provider];
                          return <Icon size={20} className={PROVIDER_COLORS[selected.provider]} />;
                        })()}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{selected.label}</h3>
                        <span className={`text-xs flex items-center gap-1 ${selected.connected ? 'text-chart-2' : 'text-muted-foreground'}`}>
                          {selected.connected && <CheckCircle2 size={10} />}
                          {selected.connected ? 'Connected' : 'Not connected'}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={selected.connected}
                      onCheckedChange={() => toggleConnection(selected.id)}
                    />
                  </div>
                </CardContent>
              </Card>

              {selected.connected && selected.channels.length > 0 && (
                <SettingSection
                  title="Channels & Events"
                  description="Configure which channels receive which events from this integration."
                >
                  <div className="space-y-3">
                    {selected.channels.map(channel => (
                      <div key={channel.id} className="border border-border/40 rounded-md p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{channel.name}</span>
                          <span className="text-xs text-muted-foreground">
                            · {channel.events.length} event{channel.events.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {EVENT_OPTIONS.map(event => {
                            const active = channel.events.includes(event);
                            return (
                              <button
                                key={event}
                                type="button"
                                onClick={() => toggleChannelEvent(selected.id, channel.id, event)}
                                aria-pressed={active}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                                  active
                                    ? 'bg-chart-1/15 border-chart-1/40 text-chart-1'
                                    : 'border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40'
                                }`}
                              >
                                {event}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </SettingSection>
              )}

              {selected.connected && selected.channels.length === 0 && (
                <div className="border border-dashed border-border/40 rounded-md p-6 text-center">
                  <p className="text-sm text-muted-foreground">No channels configured yet.</p>
                </div>
              )}

              <div className="flex justify-start pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => toggleConnection(selected.id)}
                  className={`gap-1.5 ${selected.connected ? 'border-chart-5/60 text-chart-5 hover:bg-chart-5/10 hover:border-chart-5' : ''}`}
                >
                  {selected.connected ? (
                    <>
                      <Unplug size={13} />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <Plug size={13} />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <ResetSection domain="integrations" />
      </div>
    </div>
  );
}
