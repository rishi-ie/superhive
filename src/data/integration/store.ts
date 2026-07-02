/**
 * integrations store — public API for runtime integrations.
 */
import { getDataSource } from '@/data/datasource/index';
import { IntegrationsRepository } from './repository';
import type { Integration, IntegrationChannel, IntegrationProvider } from './interface';

const repo = new IntegrationsRepository(getDataSource());

export function listIntegrations(): Integration[] {
  return repo.list();
}

export function getIntegration(id: string): Integration | undefined {
  return repo.get(id);
}

export function connectIntegration(id: string, apiKey: string, baseUrl: string | null, config: Record<string, unknown> = {}): void {
  repo.connect(id, apiKey, baseUrl, config);
}

export function disconnectIntegration(id: string): void {
  repo.disconnect(id);
}

export function listChannels(integrationId: string): IntegrationChannel[] {
  return repo.listChannels(integrationId);
}

export function addChannel(integrationId: string, name: string, events: string[]): IntegrationChannel {
  return repo.addChannel(integrationId, name, events);
}

export function removeChannel(id: string): boolean {
  return repo.removeChannel(id);
}

export type { Integration, IntegrationChannel, IntegrationProvider };
