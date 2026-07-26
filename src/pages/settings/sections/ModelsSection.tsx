import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { PlusIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ModelRow } from './ModelsSection/ModelRow';
import { ModelEditorDialog } from './ModelsSection/ModelEditorDialog';
import { APIKeysSection } from './ModelsSection/APIKeys';
import { useProviders, useModels } from '@/flows/settings';
import { useModelUpdatedSubscription } from '@/flows/settings/ui/use-model-updated';
import { setModelEnabled } from '@/flows/settings/crud/set-model-enabled';
import { addModel } from '@/flows/settings/crud/add-model';
import {
  CATALOG,
  getProviderMeta,
  isCatalogModel,
  type CatalogProviderMeta,
} from './ModelsSection/catalog';
import type { ModelEntry, ProviderEntry } from '@/types/electron';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import { SettingsDivider, SettingsPanel } from '../SettingsPrimitives';

type EditorTarget =
  | { kind: 'catalog'; provider: CatalogProviderMeta; modelName: string }
  | { kind: 'custom'; existingModel: ModelEntry; existingProvider?: ProviderEntry }
  | { kind: 'new' };

export function ModelsSection() {
  const { providers, hasApiKey, refresh: refreshProviders, loading: loadingProviders } = useProviders();
  const { models: storedModels, loading: loadingModels, refresh: refreshModels } = useModels();

  const [editor, setEditor] = React.useState<EditorTarget | null>(null);

  const refreshAll = React.useCallback(async () => {
    await Promise.all([refreshProviders(), refreshModels()]);
  }, [refreshProviders, refreshModels]);

  // Auto-fill contextWindow via Pi telemetry. When the main process writes
  // back a previously-undefined ModelEntry.contextWindow, refresh the list
  // so the chip on the row re-renders.
  useModelUpdatedSubscription(refreshModels);

  const catalogById = React.useMemo(
    () => new Map(CATALOG.map((m) => [m.id, m])),
    [],
  );

  const customModels = React.useMemo(
    () => storedModels.filter((m) => !isCatalogModel(m.id)),
    [storedModels],
  );

  const onToggleModel = async (m: ModelEntry, enabled: boolean, modelHasKey: boolean) => {
    if (!modelHasKey) {
      const catalog = catalogById.get(m.id);
      const providerMeta = catalog ? getProviderMeta(catalog.provider) : getProviderMeta(m.provider);
      if (providerMeta) {
        setEditor({ kind: 'catalog', provider: providerMeta, modelName: catalog?.name ?? m.name });
        return;
      }
      setEditor({ kind: 'custom', existingModel: m, existingProvider: providers[m.provider] });
      return;
    }

    if (!storedModels.find((s) => s.id === m.id)) {
      await addModel({ provider: m.provider, name: m.name });
    }
    await setModelEnabled(m.id, enabled);
    await refreshModels();
  };

  const onDeleteCustomModel = async (id: string) => {
    const result = await deleteModel(id);
    if (result.ok) await refreshModels();
  };

  const loading = loadingProviders || loadingModels;

  return (
    <div className="flex flex-col gap-6">
      <SettingsPanel
        title="Models"
        description="Enable the models available in chat."
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditor({ kind: 'new' })}
          >
            <Icon icon={PlusIcon} data-icon="inline-start" />
            Add model
          </Button>
        }
      >
        {loading ? null : (
          <>
            {CATALOG.map((m) => {
              const stored = storedModels.find((s) => s.id === m.id);
              const modelHasKey = hasApiKey(m.provider);
              return (
                <React.Fragment key={m.id}>
                  <ModelRow
                    model={{
                      id: m.id,
                      provider: m.provider,
                      name: m.name,
                      enabled: Boolean(stored?.enabled),
                      isCustom: stored?.isCustom ?? false,
                    }}
                    hasApiKey={modelHasKey}
                    onToggleEnabled={(enabled: boolean) =>
                      onToggleModel(
                        { id: m.id, provider: m.provider, name: m.name, enabled, isCustom: stored?.isCustom ?? false },
                        enabled,
                        modelHasKey,
                      )
                    }
                    onConfigure={() => {
                      const providerMeta = getProviderMeta(m.provider);
                      if (providerMeta) setEditor({ kind: 'catalog', provider: providerMeta, modelName: m.name });
                      else setEditor({ kind: 'new' });
                    }}
                  />
                  {(m !== CATALOG[CATALOG.length - 1] || customModels.length > 0) ? <SettingsDivider /> : null}
                </React.Fragment>
              );
            })}
            {customModels.map((m) => {
              const modelHasKey = hasApiKey(m.provider);
              return (
                <React.Fragment key={m.id}>
                  <ModelRow
                    model={{
                      id: m.id,
                      provider: m.provider,
                      name: m.name,
                      enabled: Boolean(m.enabled),
                      isCustom: m.isCustom ?? true,
                      contextWindow: m.contextWindow,
                    }}
                    hasApiKey={modelHasKey}
                    onToggleEnabled={(enabled: boolean) => onToggleModel(
                      { id: m.id, provider: m.provider, name: m.name, enabled, isCustom: m.isCustom ?? true },
                      enabled,
                      modelHasKey,
                    )}
                    onConfigure={() => setEditor({ kind: 'custom', existingModel: m, existingProvider: providers[m.provider] })}
                    onDelete={() => onDeleteCustomModel(m.id)}
                  />
                  {m !== customModels[customModels.length - 1] ? <SettingsDivider /> : null}
                </React.Fragment>
              );
            })}
          </>
        )}
      </SettingsPanel>

      <APIKeysSection />

      <ModelEditorDialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        onSaved={refreshAll}
        catalogProvider={editor?.kind === 'catalog' ? editor.provider : undefined}
        catalogModelName={editor?.kind === 'catalog' ? editor.modelName : undefined}
        existingModel={editor?.kind === 'custom' ? editor.existingModel : undefined}
        existingProvider={
          editor?.kind === 'catalog'
            ? providers[editor.provider.name]
            : editor?.kind === 'custom'
              ? editor.existingProvider
              : undefined
        }
      />
    </div>
  );
}
