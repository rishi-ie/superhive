import { Icon } from "@/components/ui/icon";
import { PuzzlePieceIcon } from "@phosphor-icons/react";

export function PluginsView() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Icon icon={PuzzlePieceIcon} className="size-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Plugins</span>
      </div>
    </div>
  );
}
