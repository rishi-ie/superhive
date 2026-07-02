/**
 * integrations repository — thin wrapper over DataSource.integrations + integrationChannels.
 */
import type { DataSource } from '@/data/datasource/types';
import type { Integration, IntegrationChannel } from './interface';

export class IntegrationsRepository {
  constructor(private ds: DataSource) {}

  list(): Integration[] {
    return this.ds.integrations.findAll() as Integration[];
  }

  get(id: string): Integration | undefined {
    return this.ds.integrations.findById(id) as Integration | undefined;
  }

  connect(id: string, apiKey: string, baseUrl: string | null, config: Record<string, unknown>): void {
    this.ds.integrations.upsert(id, {
      connected: true,
      apiKey,
      baseUrl,
      configJson: JSON.stringify(config),
      updatedAt: new Date().toISOString(),
    });
  }

  disconnect(id: string): void {
    this.ds.integrations.upsert(id, {
      connected: false,
      apiKey: null,
      baseUrl: null,
      configJson: null,
      updatedAt: new Date().toISOString(),
    });
  }

  listChannels(integrationId: string): IntegrationChannel[] {
    return this.ds.integrationChannels.findByIntegrationId(integrationId).map((c) => ({
      ...c,
      events: JSON.parse(c.eventsJson) as string[],
    }));
  }

  addChannel(integrationId: string, name: string, events: string[]): IntegrationChannel {
    const created = this.ds.integrationChannels.create({
      integrationId,
      name,
      eventsJson: JSON.stringify(events),
    });
    return { ...created, events: JSON.parse(created.eventsJson) as string[] };
  }

  removeChannel(id: string): boolean {
    return this.ds.integrationChannels.remove(id);
  }
}
