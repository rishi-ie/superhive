import { Switch } from "@/components/ui/switch";
import type { SettingsSectionProps } from "./registry";

/**
 * Prompts section — see SkillsSection.tsx for the full design note.
 * `settings.prompts: string[]` (active set in manage.json) against
 * `settings.catalog.prompts` (catalog list from settings.json).
 */

interface CatalogItem {
  path: string;
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

export function getPromptsAtoms(settings: SettingsSectionProps["settings"]) {
  return ((settings.catalog?.prompts ?? []) as CatalogItem[]).map((item) => ({
    id: item.path,
    label: nameOf(item),
    description: item.path,
  }));
}

export function PromptsSection({ settings, patch, query }: SettingsSectionProps) {
  const catalog = (settings.catalog?.prompts ?? []) as CatalogItem[];
  const activeSet = new Set((settings.prompts ?? []) as string[]);
  const tokens = (query ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = filterItems(catalog, tokens);

  const toggle = (path: string) => {
    const next = new Set(activeSet);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    patch?.("prompts", Array.from(next));
  };

  if (tokens.length > 0 && filtered.length === 0) return null;

  if (catalog.length === 0) {
    return (
      <div className="flex flex-col gap-gap-tight py-1">
        <span className="text-xs text-muted-foreground">No prompts catalogued yet.</span>
        <span className="text-[11px] text-muted-foreground/60">
          The truth extension scans the workspace on first launch; reload to re-scan.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {filtered.map(({ item }) => (
        <div
          key={item.path}
          className="flex items-center justify-between gap-gap-loose py-1"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-foreground">{nameOf(item)}</span>
            <span className="text-[11px] text-muted-foreground">{item.path}</span>
          </div>
          <Switch
            checked={activeSet.has(item.path)}
            onCheckedChange={() => toggle(item.path)}
          />
        </div>
      ))}
    </div>
  );
}
