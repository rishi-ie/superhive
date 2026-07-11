import * as React from 'react';
import { Icon } from '@/components/ui/icon';
import { PlusIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { ModelRow } from './ModelsSection/ModelRow';
import { ModelEditorDialog } from './ModelsSection/ModelEditorDialog';
import { APIKeysSection } from './ModelsSection/APIKeys';
import { useProviders, useModels } from '@/flows/settings';
import { setModelEnabled } from '@/flows/settings/crud/set-model-enabled';
import { addModel } from '@/flows/settings/crud/add-model';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import { deleteProvider } from '@/flows/settings/crud/delete-provider';
import { CATALOG, isCatalogModel, getCatalogModel } from './ModelsSection/catalog';
import type { CatalogModel } from './ModelsSection/catalog';
import type { ModelEntry, ProviderEntry } from '@/types/electron';

interface MergedModel extends ModelEntry {
  isFromCatalog: boolean;
}

function mergeModels(catalog: typeof CATALOG, stored: ModelEntry[]): MergedModel[] {
  const storedById = new Map(stored.map((m) => [m.id, m]));
  const merged: MergedModel[] = [];
  for (const c of catalog) {
    const existing = storedById.get(c.id);
    if (existing) {
      merged.push({ ...existing, isFromCatalog: true });
    } else {
      merged.push({
        id: c.id,
        provider: c.provider,
        name: c.name,
        enabled: false,
        isFromCatalog: true,
      });
    }
  }
  for (const s of stored) {
    if (!isCatalogModel(s.id)) {
      merged.push({ ...s, isFromCatalog: false });
    }
  }
  return merged;
}

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

  const merged = React.useMemo(
    () => mergeModels(CATALOG, storedModels),
    [storedModels],
  );

  const onToggleModel = async (m: MergedModel, enabled: boolean, modelHasKey: boolean) => {
    if (!modelHasKey) {
      const catalog = getCatalogModel(m.id);
      if (catalog) setEditor({ kind: 'catalog', catalog });
      else setEditor({ kind: 'custom', existingModel: m, existingProvider: providers[m.provider] });
      return;
    }
    if (m.isFromCatalog && !storedModels.find((s) => s.id === m.id)) {
      await addModel({ provider: m.provider, name: m.name });
    }
    await setModelEnabled(m.id, enabled);
    await refreshModels();
  };

  const onDeleteCustom = async (id: string, providerName: string) => {
    await deleteModel(id);
    if (providers[providerName]) {
      await deleteProvider(providerName);
    }
    await refreshAll();
  };

  const loading = loadingProviders || loadingModels;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Models</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Add an API key for each provider to enable its models in chat.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditor({ kind: 'new' })}
            className="gap-1.5"
          >
            <Icon icon={PlusIcon} className="size-3.5" />
            Add model
          </Button>
        </div>

        {loading ? null : merged.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-card/50 px-4 py-6 text-center text-xs text-muted-foreground">
            No models available.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {merged.map((m) => {
              const modelHasKey = hasApiKey(m.provider);
              const catalog = m.isFromCatalog ? getCatalogModel(m.id) : undefined;
              const existingProvider = providers[m.provider];
              return (
                <ModelRow
                  key={m.id}
                  model={m}
                  hasApiKey={modelHasKey}
                  onToggleEnabled={(enabled: boolean) => onToggleModel(m, enabled, modelHasKey)}
                  onConfigure={() => {
                    if (catalog) {
                      setEditor({
                        kind: 'catalog',
                        catalog,
                        existingModel: m.isFromCatalog ? undefined : m,
                      });
                    } else {
                      setEditor({ kind: 'custom', existingModel: m, existingProvider });
                    }
                  }}
                  onDelete={
                    m.isFromCatalog
                      ? undefined
                      : () => onDeleteCustom(m.id, m.provider)
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <APIKeysSection />
      </section>

      <ModelEditorDialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        onSaved={refreshAll}
        catalogEntry={editor?.kind === 'catalog' ? editor.catalog : undefined}
        existingModel={
          editor?.kind === 'catalog'
            ? editor.existingModel
            : editor?.kind === 'custom'
              ? editor.existingModel
              : undefined
        }
        existingProvider={
          editor?.kind === 'catalog'
            ? providers[editor.catalog.provider]
            : editor?.kind === 'custom'
              ? editor.existingProvider
              : undefined
        }
      />
    </div>
  );
}
