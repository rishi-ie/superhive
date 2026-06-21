import { ChevronDown, Folder, List, ChevronsDownUp } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { STROKE_WIDTH } from "@/lib/constants";

type FilterToolbarProps = {
  changesLabel?: string;
  fileCount?: number;
  onFolderToggle?: () => void;
  onListToggle?: () => void;
  onExpandCollapse?: () => void;
};

export function FilterToolbar({
  changesLabel = "All changes",
  fileCount = 0,
  onFolderToggle,
  onListToggle,
  onExpandCollapse,
}: FilterToolbarProps) {
  return (
    <div className="flex items-center gap-2 border-b border-sidebar-border px-3 h-9 py-1">
      <button className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-muted-foreground hover:text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-md transition-colors">
        <span>{changesLabel}</span>
        <ChevronDown size={12} />
      </button>
      <span className="text-[10px] font-fustat text-muted-foreground tabular-nums">
        {fileCount} files
      </span>
      <div className="flex-1" />
      <IconButton size="xs" onClick={onFolderToggle} aria-label="Folder view">
        <Folder size={12} strokeWidth={STROKE_WIDTH} />
      </IconButton>
      <IconButton size="xs" onClick={onListToggle} aria-label="List view">
        <List size={12} strokeWidth={STROKE_WIDTH} />
      </IconButton>
      <IconButton
        size="xs"
        onClick={onExpandCollapse}
        aria-label="Expand/collapse all"
      >
        <ChevronsDownUp size={12} strokeWidth={STROKE_WIDTH} />
      </IconButton>
    </div>
  );
}
