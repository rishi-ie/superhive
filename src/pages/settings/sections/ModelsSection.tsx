import * as React from 'react';
import { Icon } from "@/components/ui/icon";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ModelDialog } from './ModelsSection/ModelDialog';
import { ModelRow } from './ModelsSection/ModelRow';
import { APIKeysSection } from './ModelsSection/APIKeys';
import { useProviders, useModels } from '@/flows/settings';
import { setModelEnabled } from '@/flows/settings/crud/set-model-enabled';
import { addModel } from '@/flows/settings/crud/add-model';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import { CATALOG, isCatalogModel } from './ModelsSection/catalog';
import type { ModelEntry } from '@/types/electron';

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

export function ModelsSection() {
  const { providerNames, loading: loadingProviders } = useProviders();
  const { models: storedModels, loading: loadingModels, refresh: refreshModels } = useModels();

  const [modelDialogOpen, setModelDialogOpen] = React.useState(false);

  const merged = React.useMemo(
    () => mergeModels(CATALOG, storedModels),
    [storedModels],
  );

  const onToggleModel = async (m: MergedModel, enabled: boolean, hasProvider: boolean) => {
    if (!hasProvider) {
      // The switch is also visually disabled (see ModelRow), but a defensive
      // guard is kept here in case the row is reached programmatically.
      return;
    }
    if (m.isFromCatalog && !storedModels.find((s) => s.id === m.id)) {
      await addModel({ provider: m.provider, name: m.name });
    }
    await setModelEnabled(m.id, enabled);
    await refreshModels();
  };

  const onDeleteModel = async (id: string) => {
    await deleteModel(id);
    await refreshModels();
  };

  const loading = loadingProviders || loadingModels;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Models</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModelDialogOpen(true)}
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
              const hasProvider = providerNames.has(m.provider);
              return (
                <ModelRow
                  key={m.id}
                  model={m}
                  hasProvider={hasProvider}
                  onToggleEnabled={(enabled: boolean) => onToggleModel(m, enabled, hasProvider)}
                  onDelete={m.isFromCatalog ? undefined : () => onDeleteModel(m.id)}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <APIKeysSection />
      </section>

      <ModelDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        onSaved={refreshModels}
      />
    </div>
  );
}