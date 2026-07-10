import * as React from 'react';
import { listModels } from '@/flows/settings/crud/list-models';
import type { ModelEntry } from '@/types/electron';

export interface UseModelsResult {
  models: ModelEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useModels(): UseModelsResult {
  const [models, setModels] = React.useState<ModelEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const list = await listModels();
      setModels(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { models, loading, error, refresh };
}