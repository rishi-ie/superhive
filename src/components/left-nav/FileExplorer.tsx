import { fileTree } from '@/data/file-tree';
import { TreeItem } from './TreeItem';

export function FileExplorer() {
  return (
    <div className="flex-1 overflow-y-auto py-2">
      <div className="px-3 py-1 mb-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          Explorer
        </span>
      </div>
      <div className="px-1">
        {fileTree.map((item, i) => (
          <TreeItem key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
