import { SettingRow } from "../primitives/SettingRow";
import { Switch } from "@/components/ui/switch";
import type { SettingsSectionProps } from "./registry";

const ROWS = [
  { key: "filesystem" as const, label: "Filesystem", description: "Read and write local files" },
  { key: "terminal" as const, label: "Terminal", description: "Run shell commands" },
  { key: "network" as const, label: "Network", description: "Make HTTP requests" },
];

function matchesTokens(text: string, tokens: string[]): boolean {
  const haystack = text.toLowerCase();
  return tokens.every((t) => haystack.includes(t));
}

export function getPermissionsAtoms() {
  return ROWS.map((r) => ({
    id: r.key,
    label: r.label,
    description: r.description,
  }));
}

export function PermissionsSection({ settings, patch, query }: SettingsSectionProps) {
  const perms = settings.permissions ?? {
    filesystem: true,
    terminal: true,
    network: true,
  };

  const setPerm = (key: "filesystem" | "terminal" | "network", value: boolean) => {
    patch?.("permissions", { ...perms, [key]: value });
  };

  const tokens = (query ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = tokens.length === 0
    ? ROWS
    : ROWS.filter(
        (r) =>
          matchesTokens(r.label, tokens) ||
          matchesTokens(r.description ?? "", tokens),
      );

  if (tokens.length > 0 && filtered.length === 0) return null;

  return (
    <div className="flex flex-col">
      {filtered.map((r) => (
        <SettingRow key={r.key} label={r.label} description={r.description}>
          <Switch
            checked={perms[r.key] ?? true}
            onCheckedChange={(v) => setPerm(r.key, v)}
          />
        </SettingRow>
      ))}
    </div>
  );
}
