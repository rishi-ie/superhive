import * as React from 'react';
import { HugeiconsIcon } from "@/components/ui/icon";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { ProviderDialog } from './ModelsSection/ProviderDialog';
import { ModelDialog } from './ModelsSection/ModelDialog';
import { ProviderRow } from './ModelsSection/ProviderRow';
import { ModelRow } from './ModelsSection/ModelRow';
import { toast } from 'sonner';
import { useProviders, useModels } from '@/flows/settings';
import { setModelEnabled } from '@/flows/settings/crud/set-model-enabled';
import { addModel } from '@/flows/settings/crud/add-model';
import { deleteModel } from '@/flows/settings/crud/delete-model';
import { deleteProvider } from '@/flows/settings/crud/delete-provider';
import { CATALOG, isCatalogModel } from './ModelsSection/catalog';
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

export function ModelsSection() {
  const { providers, loading: loadingProviders, refresh: refreshProviders } = useProviders();
  const { models: storedModels, loading: loadingModels, refresh: refreshModels } = useModels();

  const [providerDialogOpen, setProviderDialogOpen] = React.useState(false);
  const [editingProvider, setEditingProvider] = React.useState<string | undefined>(undefined);
  const [modelDialogOpen, setModelDialogOpen] = React.useState(false);

  const merged = React.useMemo(
    () => mergeModels(CATALOG, storedModels),
    [storedModels],
  );

  const providerNames = React.useMemo(
    () => new Set(Object.keys(providers)),
    [providers],
  );

  const onAddProvider = () => {
    setEditingProvider(undefined);
    setProviderDialogOpen(true);
  };

  const onEditProvider = (name: string) => {
    setEditingProvider(name);
    setProviderDialogOpen(true);
  };

  const onDeleteProvider = async (name: string) => {
    await deleteProvider(name);
    await refreshProviders();
  };

  const onToggleModel = async (m: MergedModel, enabled: boolean, hasProvider: boolean) => {
    // Block toggling a model whose provider has no key configured.
    // The switch is also visually disabled (see ModelRow), but a defensive guard
    // is kept here in case the row is reached programmatically.
    if (!hasProvider) {
      toast.error(`Add a key for "${m.provider}" first`);
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
  const sortedProviderEntries: Array<[string, ProviderEntry]> = Object.entries(providers).sort(
    ([a], [b]) => a.localeCompare(b),
  );

  return (
    <div className="flex flex-col gap-8 w-1/2 max-w-2xl mx-auto px-6">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Models</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setModelDialogOpen(true)}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
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
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Providers</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddProvider}
            className="gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
            Add provider
          </Button>
        </div>

        {loading ? null : sortedProviderEntries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-card/50 px-4 py-8 text-center">
            <p className="text-xs text-muted-foreground">
              Add a provider to start configuring your own API keys.
            </p>
            <Button
              size="sm"
              variant="default"
              onClick={onAddProvider}
              className="gap-1.5"
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
              Add provider
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedProviderEntries.map(([name, entry]) => (
              <ProviderRow
                key={name}
                name={name}
                entry={entry}
                onEdit={() => onEditProvider(name)}
                onDelete={() => onDeleteProvider(name)}
              />
            ))}
          </div>
        )}
      </section>

      <ProviderDialog
        open={providerDialogOpen}
        onOpenChange={setProviderDialogOpen}
        initialName={editingProvider}
        onSaved={refreshProviders}
      />
      <ModelDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        onSaved={refreshModels}
      />
    </div>
  );
}