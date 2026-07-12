import { toast } from 'sonner';
import { settings } from '@/api/settings';

export interface AddCustomModelInput {
  provider: string;
  modelName: string;
  baseUrl?: string;
  apiKey: string;
  contextWindow?: number;
}

export interface AddCustomModelResult {
  ok: boolean;
  error?: string;
}

export async function addCustomModel(
  input: AddCustomModelInput,
): Promise<AddCustomModelResult> {
  const provider = input.provider?.trim();
  const modelName = input.modelName?.trim();
  const apiKey = input.apiKey?.trim();

  if (!provider) {
    toast.error('Provider name is required');
    return { ok: false, error: 'Provider name is required' };
  }
  if (!modelName) {
    toast.error('Model name is required');
    return { ok: false, error: 'Model name is required' };
  }
  if (!apiKey) {
    toast.error('API key is required');
    return { ok: false, error: 'API key is required' };
  }

  try {
    await settings.setProvider({
      name: provider,
      baseUrl: input.baseUrl?.trim() || undefined,
      apiKey,
    });
    await settings.addModel({
      provider,
      name: modelName,
      contextWindow: input.contextWindow,
    });
    toast.success(`Added ${provider}:${modelName}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add model';
    toast.error(message);
    return { ok: false, error: message };
  }
}
