import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import type { TreeNode } from '@/data/file-tree';

type TreeItemProps = {
  item: TreeNode;
  depth?: number;
};

export function TreeItem({ item, depth = 0 }: TreeItemProps) {
  const [expanded, setExpanded] = useState(depth === 0);

  if (item.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 w-full px-2 py-1 text-sm hover:bg-accent/50 rounded-md text-left transition-colors"
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          {expanded ? (
            <ChevronDown size={12} className="text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight size={12} className="text-muted-foreground shrink-0" />
          )}
          <Folder size={14} className="text-muted-foreground shrink-0" />
          <span className="truncate text-sidebar-foreground">{item.name}</span>
        </button>
        {expanded && (
          <div>
            {item.children?.map((child, i) => (
              <TreeItem key={i} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className="flex items-center gap-1.5 w-full px-2 py-1 text-sm hover:bg-accent/50 rounded-md text-left transition-colors"
      style={{ paddingLeft: `${20 + depth * 12}px` }}
    >
      <File size={14} className="text-muted-foreground shrink-0" />
      <span className="truncate text-sidebar-foreground">{item.name}</span>
    </button>
  );
}
