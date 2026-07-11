import { Switch } from "@/components/ui/switch";

interface CatalogRowProps {
  name: string;
  active: boolean;
  onToggle: () => void;
}

export function CatalogRow({ name, active, onToggle }: CatalogRowProps) {
  return (
    <div className="flex items-center justify-between gap-gap-loose py-0.5">
      <span className="truncate text-sm text-foreground">{name}</span>
      <Switch checked={active} onCheckedChange={onToggle} />
    </div>
  );
}
