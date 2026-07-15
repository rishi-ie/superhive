import { SettingRow } from "../primitives/SettingRow";
import { Switch } from "@/components/ui/switch";
import type { SettingsSectionProps } from "./registry";

interface CatalogItem {
  path: string;
  active: boolean;
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
  return (settings.catalog?.extensions ?? []).map((item) => ({
    id: item.path,
    label: nameOf(item),
    description: item.path,
  }));
}

export function ExtensionsSection({ settings, patch, query }: SettingsSectionProps) {
  const extensions = settings.catalog?.extensions ?? [];
  const tokens = (query ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = filterItems(extensions, tokens);

  const toggle = (originalIndex: number) => {
    const next = extensions.map((item, i) =>
      i === originalIndex ? { ...item, active: !item.active } : item,
    );
    patch?.("catalog.extensions", next);
  };

  if (tokens.length > 0 && filtered.length === 0) return null;

  return (
    <div className="flex flex-col">
      {filtered.map(({ item, originalIndex }) => (
        <SettingRow key={originalIndex} label={nameOf(item)} description={item.path}>
          <Switch
            checked={item.active}
            onCheckedChange={() => toggle(originalIndex)}
          />
        </SettingRow>
      ))}
    </div>
  );
}
