import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { PlusIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModelRow } from './ModelsSection/ModelRow';
import { ModelEditorDialog } from './ModelsSection/ModelEditorDialog';
import { APIKeysSection } from './ModelsSection/APIKeys';
import { useProviders, useModels } from '@/flows/settings';
import { useModelUpdatedSubscription } from '@/flows/settings/ui/use-model-updated';
import { setModelEnabled } from '@/flows/settings/crud/set-model-enabled';
import {
  CATALOG,
  getProviderMeta,
  isCatalogModel,
  type CatalogModel,
} from './ModelsSection/catalog';
import type { ModelEntry, ProviderEntry } from '@/types/electron';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import { SettingsDivider, SettingsPanel } from '../SettingsPrimitives';

type EditorTarget =
  | { kind: 'catalog'; catalog: CatalogModel; existingModel?: ModelEntry }
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
  // so the row metadata re-renders.
  useModelUpdatedSubscription(refreshModels);

  const customModels = React.useMemo(
    () => storedModels.filter((m) => !isCatalogModel(m.id) && !m.catalogId),
    [storedModels],
  );

  const onToggleModel = async (m: ModelEntry, enabled: boolean) => {
    await setModelEnabled(m.id, enabled);
    await refreshModels();
  };

  const onDeleteCustomModel = async (id: string) => {
    const result = await deleteModel(id);
    if (result.ok) await refreshModels();
  };

  const loading = loadingProviders || loadingModels;

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium text-foreground">Available models</h2>
            <p className="text-xs/relaxed text-muted-foreground">Enable the models available in chat.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setEditor({ kind: 'new' })}
          >
            <Icon icon={PlusIcon} data-icon="inline-start" />
            Add model
          </Button>
        </div>
        <SettingsPanel>
          {loading ? (
            <div className="flex flex-col">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-4 px-(--card-spacing) py-3">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {CATALOG.map((m) => {
              const stored = storedModels.find((s) => s.id === m.id || s.catalogId === m.id);
              const model: ModelEntry = stored ?? {
                id: m.id,
                provider: m.provider,
                name: m.name,
                enabled: false,
                isCustom: false,
              };
              const modelHasKey = hasApiKey(model.provider);
              const openEditor = () => setEditor({ kind: 'catalog', catalog: m, existingModel: stored });
              return (
                <React.Fragment key={m.id}>
                  <ModelRow
                    model={model}
                    hasApiKey={modelHasKey}
                    onToggleEnabled={(enabled: boolean) => {
                      if (!modelHasKey) openEditor();
                      else void onToggleModel(model, enabled);
                    }}
                    onConfigure={openEditor}
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
                    onToggleEnabled={(enabled: boolean) => {
                      if (!modelHasKey) setEditor({ kind: 'custom', existingModel: m, existingProvider: providers[m.provider] });
                      else void onToggleModel(m, enabled);
                    }}
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
      </section>

      <APIKeysSection />

      <ModelEditorDialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        onSaved={refreshAll}
        catalogProvider={editor?.kind === 'catalog' ? getProviderMeta(editor.catalog.provider) : undefined}
        catalogModelName={editor?.kind === 'catalog' ? editor.catalog.name : undefined}
        catalogId={editor?.kind === 'catalog' ? editor.catalog.id : undefined}
        existingModel={
          editor?.kind === 'catalog'
            ? editor.existingModel
            : editor?.kind === 'custom'
              ? editor.existingModel
              : undefined
        }
        existingProvider={
          editor?.kind === 'catalog'
            ? providers[editor.existingModel?.provider ?? editor.catalog.provider]
            : editor?.kind === 'custom'
              ? editor.existingProvider
              : undefined
        }
      />
    </div>
  );
}
