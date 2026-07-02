/**
 * OKF sidebar — tree view of project OKF bundle files.
 * Click a file to open it in the viewer.
 */
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import { listBundleTree, searchBundle, type OkfTreeNode } from '@/data/okf/fs';
import { SearchBar } from '@/components/ui/SearchBar';

type OkfSidebarProps = {
  projectId: string;
  onFileSelect: (path: string) => void;
  activeFile: string | null;
};

type SearchResult = { path: string; preview: string };

export function OkfSidebar({ projectId, onFileSelect, activeFile }: OkfSidebarProps) {
  const [tree, setTree] = useState<OkfTreeNode | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    let cancelled = false;
    listBundleTree(projectId).then((t) => {
      if (!cancelled) setTree(t);
    });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      searchBundle(projectId, query).then((r) => {
        if (!cancelled) setSearchResults(r);
      });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [projectId, query]);

  const toggle = (path: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  if (!tree) {
    return (
      <div className="p-3 text-[10px] text-muted-foreground italic">
        No OKF bundle yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card/30">
      <div className="p-2 border-b border-border/40">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search concepts..."
          size="sm"
        />
      </div>
      {query.trim() ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {searchResults.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic px-2">No matches</p>
          ) : (
            searchResults.map((r) => (
              <button
                key={r.path}
                onClick={() => onFileSelect(r.path)}
                className={`w-full text-left p-1.5 rounded text-xs hover:bg-hover-tint ${
                  activeFile === r.path ? 'bg-highlight text-highlight-foreground' : ''
                }`}
              >
                <div className="flex items-center gap-1 truncate">
                  <FileText size={10} strokeWidth={STROKE_WIDTH} className="shrink-0" />
                  <span className="truncate font-medium">{r.path}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{r.preview}</p>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2">
          <TreeNode
            node={tree}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            onFileSelect={onFileSelect}
            activeFile={activeFile}
          />
        </div>
      )}
    </div>
  );
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
  onFileSelect,
  activeFile,
}: {
  node: OkfTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
  activeFile: string | null;
}) {
  const isOpen = expanded.has(node.path);
  const isActive = activeFile === node.path;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => onToggle(node.path)}
          className="flex items-center gap-1 w-full text-left p-1 text-xs hover:bg-hover-tint rounded"
          style={{ paddingLeft: `${depth * 8 + 4}px` }}
        >
          {isOpen ? <ChevronDown size={10} strokeWidth={STROKE_WIDTH} /> : <ChevronRight size={10} strokeWidth={STROKE_WIDTH} />}
          {isOpen ? <FolderOpen size={10} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" /> : <Folder size={10} strokeWidth={STROKE_WIDTH} className="text-muted-foreground" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children?.map((c) => (
          <TreeNode
            key={c.path}
            node={c}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
            onFileSelect={onFileSelect}
            activeFile={activeFile}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className={`flex items-center gap-1 w-full text-left p-1 text-xs rounded ${
        isActive ? 'bg-highlight text-highlight-foreground' : 'hover:bg-hover-tint'
      }`}
      style={{ paddingLeft: `${depth * 8 + 20}px` }}
    >
      <FileText size={10} strokeWidth={STROKE_WIDTH} className="shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
