import { useState, useRef, useEffect } from 'react';
import { ChevronsUpDown, Check, Settings, LogOut } from 'lucide-react';
import { STROKE_WIDTH } from '@/lib/constants';
import type { Workspace } from '@/data/workspaces/interface';

export type { Workspace };

type TeamSelectorProps = {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onWorkspaceSelect?: (workspace: Workspace) => void;
  onSettingsClick?: () => void;
};

export function TeamSelector({
  workspaces,
  currentWorkspace,
  onWorkspaceSelect,
  onSettingsClick,
}: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerAvatarColor = currentWorkspace.avatarColor ?? 'bg-chart-1';

  return (
    <div className="px-2 pt-1 pb-2" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="no-drag flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-tertiary px-2 py-1.5 text-sm font-medium hover:bg-tertiary-active transition-colors"
        >
          <div
            className={`size-6 shrink-0 rounded-md ${triggerAvatarColor} flex items-center justify-center text-[10px] font-bold text-sidebar-primary-foreground`}
          >
            {currentWorkspace.initials}
          </div>
          <span className="flex-1 text-left text-sidebar-foreground truncate">
            {currentWorkspace.name}
          </span>
          <ChevronsUpDown size={12} className="text-muted-foreground shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-sidebar-border bg-popover py-1 shadow-md">
            <div className="px-2 py-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Workspaces
              </span>
            </div>
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => {
                  onWorkspaceSelect?.(workspace);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent transition-colors"
              >
                <div
                  className={`size-5 shrink-0 rounded ${workspace.avatarColor ?? 'bg-chart-1'} flex items-center justify-center text-[9px] font-bold text-sidebar-primary-foreground`}
                >
                  {workspace.initials}
                </div>
                <span className="flex-1 text-left text-xs">{workspace.name}</span>
                {workspace.id === currentWorkspace.id && (
                  <Check size={12} strokeWidth={STROKE_WIDTH} className="shrink-0 text-chart-2" />
                )}
              </button>
            ))}
            <div className="my-1 border-t border-sidebar-border" />
            <button
              onClick={() => {
                onSettingsClick?.();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent transition-colors"
            >
              <Settings size={14} strokeWidth={STROKE_WIDTH} className="shrink-0" />
              <span className="flex-1 text-left text-xs">Settings</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-popover-foreground hover:bg-accent transition-colors"
            >
              <LogOut size={14} strokeWidth={STROKE_WIDTH} className="shrink-0" />
              <span className="flex-1 text-left text-xs">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
