/**
 * integrations — runtime integrations registry (GitHub, Slack, Linear, Notion, Jira, Webhook).
 *
 * Separate from settings.integrations — this table tracks connection state at runtime
 * while settings tracks display config.
 */
export type IntegrationProvider = 'github' | 'slack' | 'linear' | 'notion' | 'jira' | 'webhook';

export type Integration = {
  id: string;
  provider: IntegrationProvider;
  label: string;
  connected: boolean;
  apiKey: string | null;
  baseUrl: string | null;
  configJson: string | null;
  updatedAt: string;
};

export type IntegrationChannel = {
  id: string;
  integrationId: string;
  name: string;
  events: string[];
};
