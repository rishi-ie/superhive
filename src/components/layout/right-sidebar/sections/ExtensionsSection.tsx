import { Switch } from "@/components/ui/switch";
import type { SettingsSectionProps } from "./registry";

/**
 * Extensions section — see SkillsSection.tsx for the full design note.
 * `settings.extensions: string[]` (active set in manage.json) against
 * `settings.catalog.extensions` (catalog list from settings.json).
 */

interface CatalogItem {
  path: string;
  manifest?: {
    id?: string;
    title?: string;
    description?: string;
    apply?: 'next-turn' | 'restart-required';
    settings?: { properties?: Record<string, { type?: string; title?: string; description?: string; enum?: string[] }> };
  };
}

function nameOf(item: CatalogItem): string {
  return item.path.split("/").pop() ?? item.path;
}

function filterItems(
  list: CatalogItem[],
  tokens: string[],
): Array<{ item: CatalogItem; originalIndex: number }> {
  if (tokens.length === 0) {
    return list.map((item, i) => ({ item, originalIndex: i }));
  }
  return list
    .map((item, i) => ({ item, originalIndex: i }))
    .filter(({ item }) =>
      tokens.every(
        (t) =>
          nameOf(item).toLowerCase().includes(t) ||
          item.path.toLowerCase().includes(t),
      ),
    );
}

export function getExtensionsAtoms(settings: SettingsSectionProps["settings"]) {
  return ((settings.catalog?.extensions ?? []) as CatalogItem[]).map((item) => ({
    id: item.path,
    label: nameOf(item),
    description: item.path,
  }));
}

export function ExtensionsSection({ settings, patch, query }: SettingsSectionProps) {
  const catalog = (settings.catalog?.extensions ?? []) as CatalogItem[];
  const activeSet = new Set((settings.extensions ?? []) as string[]);
  const tokens = (query ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = filterItems(catalog, tokens);

  const toggle = (path: string) => {
    const next = new Set(activeSet);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    patch?.("extensions", Array.from(next));
  };

  if (tokens.length > 0 && filtered.length === 0) return null;

  if (catalog.length === 0) {
    return (
      <div className="flex flex-col gap-gap-tight py-1">
        <span className="text-xs text-muted-foreground">No extensions catalogued yet.</span>
        <span className="text-[11px] text-muted-foreground/60">
          The truth extension scans the workspace on first launch; reload to re-scan.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filtered.map(({ item }) => (
        <div key={item.path}>
          <div className="flex items-center justify-between gap-gap-loose py-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">{item.manifest?.title ?? nameOf(item)}</span>
              <span className="text-[11px] text-muted-foreground">{item.manifest?.description ?? item.path}</span>
            </div>
            <Switch checked={activeSet.has(item.path)} onCheckedChange={() => toggle(item.path)} />
          </div>
          {activeSet.has(item.path) && item.manifest?.id ? <ExtensionSchemaFields item={item} settings={settings} patch={patch} /> : null}
        </div>
      ))}
    </div>
  );
}

function ExtensionSchemaFields({ item, settings, patch }: { item: CatalogItem; settings: SettingsSectionProps['settings']; patch: SettingsSectionProps['patch'] }) {
  const extensionId = item.manifest?.id
  const properties = item.manifest?.settings?.properties
  if (!extensionId || !properties || Object.keys(properties).length === 0) return null
  const values = ((settings.extensionSettings as Record<string, Record<string, unknown>> | undefined)?.[extensionId]) ?? {}
  return (
    <div className="ml-1 mb-2 rounded border border-border/50 p-2 space-y-2">
      <span className="text-[11px] text-muted-foreground">{item.manifest?.apply === 'restart-required' ? 'Restart required' : 'Applies to the next message'}</span>
      {Object.entries(properties).map(([key, field]) => field.type === 'boolean' ? (
        <div key={key} className="flex items-center justify-between gap-3 text-xs">
          <span>{field.title ?? key}</span>
          <Switch checked={Boolean(values[key])} onCheckedChange={(value) => patch?.(`extensionSettings.${extensionId}.${key}`, value)} />
        </div>
      ) : field.enum ? (
        <label key={key} className="flex items-center justify-between gap-3 text-xs">
          <span>{field.title ?? key}</span>
          <select className="bg-transparent" value={String(values[key] ?? field.enum[0] ?? '')} onChange={(event) => patch?.(`extensionSettings.${extensionId}.${key}`, event.target.value)}>
            {field.enum.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      ) : null)}
    </div>
  )
}
