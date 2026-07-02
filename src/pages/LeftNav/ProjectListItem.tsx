/**
 * Single project row inside the Projects accordion section.
 */
import { Layers } from 'lucide-react';

type ProjectListItemProps = {
  id: string;
  name: string;
  onClick?: (id: string) => void;
};

/**
 * Single project row inside the Projects accordion section.
 * @param id - Project id
 * @param name - Project display name
 * @param onClick - Called when project is clicked
 */
export function ProjectListItem({ id, name, onClick }: ProjectListItemProps) {
  return (
    <button
      onClick={() => onClick?.(id)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors text-left"
    >
      <Layers size={10} className="shrink-0" />
      <span className="truncate">{name}</span>
    </button>
  );
}
