import * as React from 'react';
import { listProviders } from '@/flows/settings/crud/list-providers';
import type { ProviderEntry } from '@/types/electron';

export interface UseProvidersResult {
  providers: Record<string, ProviderEntry>;
  providerNames: Set<string>;
  hasProvider: (name: string) => boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProviders(): UseProvidersResult {
  const [providers, setProviders] = React.useState<Record<string, ProviderEntry>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const list = await listProviders();
      setProviders(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const providerNames = React.useMemo(
    () => new Set(Object.keys(providers)),
    [providers],
  );

  const hasProvider = React.useCallback(
    (name: string) => providerNames.has(name),
    [providerNames],
  );

  return { providers, providerNames, hasProvider, loading, error, refresh };
}
